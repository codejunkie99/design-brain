import type { DesignBrainDatabase, ProjectRecord } from './types.js';
import {
  aggregateColors,
  aggregateTypography,
  aggregateComponents,
} from './aggregate.js';
import { nameColor } from './tokenNaming.js';

// ── Graph data model ──────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  label: string;
  type: 'project' | 'color' | 'font' | 'component' | 'inspiration';
  color: string;
  size: number;
  meta: Record<string, string>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'has_color' | 'has_font' | 'has_component' | 'has_inspiration' | 'shared_token';
  weight: number;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function buildKnowledgeGraph(db: DesignBrainDatabase): KnowledgeGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeIds = new Set<string>();

  function addNode(node: GraphNode) {
    if (nodeIds.has(node.id)) return;
    nodeIds.add(node.id);
    nodes.push(node);
  }

  // Track which projects use which tokens for shared edges
  const colorProjects = new Map<string, string[]>();
  const fontProjects = new Map<string, string[]>();
  const componentProjects = new Map<string, string[]>();

  for (const project of db.projects) {
    // Project node
    addNode({
      id: `p:${project.id}`,
      label: project.name,
      type: 'project',
      color: '#6366f1',
      size: 28,
      meta: {
        captures: String(project.inspirations.length),
        outcomes: String(project.outcomes.length),
        updated: project.updatedAt.slice(0, 10),
      },
    });

    // Colors (top 8 per project)
    const colors = aggregateColors(project.inspirations);
    for (const c of colors.slice(0, 8)) {
      const hex = c.hex.toUpperCase();
      const nodeId = `c:${hex}`;
      addNode({
        id: nodeId,
        label: `${nameColor(c.hex)} ${hex}`,
        type: 'color',
        color: hex,
        size: 12,
        meta: { hex, count: String(c.count), name: nameColor(c.hex) },
      });
      edges.push({ source: `p:${project.id}`, target: nodeId, type: 'has_color', weight: c.count });

      const list = colorProjects.get(nodeId) ?? [];
      list.push(project.id);
      colorProjects.set(nodeId, list);
    }

    // Fonts (unique families)
    const typo = aggregateTypography(project.inspirations);
    const seenFonts = new Set<string>();
    for (const t of typo) {
      const family = t.fontFamily.split(',')[0].trim().replace(/['"]/g, '');
      if (seenFonts.has(family)) continue;
      seenFonts.add(family);

      const nodeId = `f:${family.toLowerCase()}`;
      addNode({
        id: nodeId,
        label: family,
        type: 'font',
        color: '#f59e0b',
        size: 14,
        meta: { family, count: String(t.count) },
      });
      edges.push({ source: `p:${project.id}`, target: nodeId, type: 'has_font', weight: t.count });

      const list = fontProjects.get(nodeId) ?? [];
      list.push(project.id);
      fontProjects.set(nodeId, list);
    }

    // Components (unique kinds, top 10)
    const components = aggregateComponents(project.inspirations);
    const seenKinds = new Set<string>();
    for (const comp of components) {
      if (seenKinds.has(comp.kind)) continue;
      seenKinds.add(comp.kind);
      if (seenKinds.size > 10) break;

      const nodeId = `k:${comp.kind}`;
      addNode({
        id: nodeId,
        label: comp.kind,
        type: 'component',
        color: '#10b981',
        size: 16,
        meta: { kind: comp.kind, count: String(comp.count) },
      });
      edges.push({ source: `p:${project.id}`, target: nodeId, type: 'has_component', weight: comp.count });

      const list = componentProjects.get(nodeId) ?? [];
      list.push(project.id);
      componentProjects.set(nodeId, list);
    }

    // Inspirations (as smaller nodes)
    for (const inspo of project.inspirations.slice(0, 6)) {
      const nodeId = `i:${inspo.id}`;
      addNode({
        id: nodeId,
        label: inspo.name.slice(0, 30),
        type: 'inspiration',
        color: '#8b5cf6',
        size: 8,
        meta: {
          url: inspo.url || '',
          captured: inspo.capturedAt.slice(0, 10),
          colors: String(inspo.analysis.colors.length),
          components: String(inspo.analysis.components.length),
        },
      });
      edges.push({ source: `p:${project.id}`, target: nodeId, type: 'has_inspiration', weight: 1 });
    }
  }

  // Add shared_token edges between projects that share colors/fonts/components
  const allShared = [colorProjects, fontProjects, componentProjects];
  const sharedPairs = new Map<string, number>();
  for (const tokenMap of allShared) {
    for (const [, projectIds] of tokenMap) {
      if (projectIds.length < 2) continue;
      const unique = [...new Set(projectIds)].sort();
      for (let i = 0; i < unique.length; i++) {
        for (let j = i + 1; j < unique.length; j++) {
          const key = `${unique[i]}|${unique[j]}`;
          sharedPairs.set(key, (sharedPairs.get(key) ?? 0) + 1);
        }
      }
    }
  }

  for (const [key, count] of sharedPairs) {
    const [a, b] = key.split('|');
    edges.push({ source: `p:${a}`, target: `p:${b}`, type: 'shared_token', weight: count });
  }

  return { nodes, edges };
}

// ── HTML generation ───────────────────────────────────────────────────

export function generateGraphHtml(graph: KnowledgeGraph): string {
  const graphJson = JSON.stringify(graph);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Design Brain — Knowledge Graph</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0f0f17; color: #e2e8f0; font-family: system-ui, -apple-system, sans-serif; overflow: hidden; }
  canvas { display: block; cursor: grab; }
  canvas:active { cursor: grabbing; }

  #ui { position: fixed; top: 0; left: 0; right: 0; padding: 16px 20px; display: flex; gap: 12px; align-items: center; z-index: 10; background: linear-gradient(to bottom, rgba(15,15,23,0.95), rgba(15,15,23,0)); pointer-events: none; }
  #ui > * { pointer-events: auto; }
  h1 { font-size: 16px; font-weight: 600; white-space: nowrap; }

  #search { background: #1e1e2e; border: 1px solid #333; border-radius: 6px; padding: 6px 12px; color: #e2e8f0; font-size: 13px; width: 220px; outline: none; }
  #search:focus { border-color: #6366f1; }
  #search::placeholder { color: #555; }

  .legend { display: flex; gap: 14px; margin-left: auto; font-size: 12px; }
  .legend-item { display: flex; align-items: center; gap: 5px; }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; }

  #tooltip { position: fixed; background: #1e1e2e; border: 1px solid #444; border-radius: 8px; padding: 10px 14px; font-size: 12px; pointer-events: none; display: none; z-index: 20; max-width: 280px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
  #tooltip .tt-title { font-weight: 600; font-size: 13px; margin-bottom: 4px; }
  #tooltip .tt-type { color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  #tooltip .tt-meta { color: #aaa; line-height: 1.5; }

  #stats { position: fixed; bottom: 16px; left: 20px; font-size: 11px; color: #555; z-index: 10; }

  .filter-btns { display: flex; gap: 4px; }
  .filter-btn { background: #1e1e2e; border: 1px solid #333; border-radius: 4px; padding: 3px 8px; font-size: 11px; color: #aaa; cursor: pointer; }
  .filter-btn.active { border-color: #6366f1; color: #e2e8f0; }
</style>
</head>
<body>
<div id="ui">
  <h1>Design Brain</h1>
  <input type="text" id="search" placeholder="Search nodes..." autocomplete="off">
  <div class="filter-btns">
    <button class="filter-btn active" data-type="all">All</button>
    <button class="filter-btn active" data-type="project">Projects</button>
    <button class="filter-btn active" data-type="color">Colors</button>
    <button class="filter-btn active" data-type="font">Fonts</button>
    <button class="filter-btn active" data-type="component">Components</button>
    <button class="filter-btn active" data-type="inspiration">Captures</button>
  </div>
  <div class="legend">
    <div class="legend-item"><div class="legend-dot" style="background:#6366f1"></div> Project</div>
    <div class="legend-item"><div class="legend-dot" style="background:#f59e0b"></div> Font</div>
    <div class="legend-item"><div class="legend-dot" style="background:#10b981"></div> Component</div>
    <div class="legend-item"><div class="legend-dot" style="background:#8b5cf6"></div> Capture</div>
  </div>
</div>
<div id="tooltip"><div class="tt-title"></div><div class="tt-type"></div><div class="tt-meta"></div></div>
<div id="stats"></div>
<canvas id="canvas"></canvas>

<script>
const DATA = ${graphJson};

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('tooltip');
const searchInput = document.getElementById('search');
const statsEl = document.getElementById('stats');

let W, H, dpr;
function resize() {
  dpr = window.devicePixelRatio || 1;
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resize();
window.addEventListener('resize', resize);

// Build simulation data
const nodes = DATA.nodes.map((n, i) => ({
  ...n,
  x: W/2 + (Math.random() - 0.5) * W * 0.6,
  y: H/2 + (Math.random() - 0.5) * H * 0.6,
  vx: 0, vy: 0,
  visible: true,
  highlighted: false,
  idx: i,
}));

const nodeMap = new Map();
nodes.forEach(n => nodeMap.set(n.id, n));

const edges = DATA.edges.map(e => ({
  ...e,
  sourceNode: nodeMap.get(e.source),
  targetNode: nodeMap.get(e.target),
})).filter(e => e.sourceNode && e.targetNode);

// Filter state
const activeTypes = new Set(['project', 'color', 'font', 'component', 'inspiration']);
let searchTerm = '';

function updateVisibility() {
  for (const n of nodes) {
    const typeMatch = activeTypes.has(n.type);
    const searchMatch = !searchTerm || n.label.toLowerCase().includes(searchTerm) || n.id.toLowerCase().includes(searchTerm);
    n.visible = typeMatch && searchMatch;
    n.highlighted = searchTerm && searchMatch;
  }
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    if (type === 'all') {
      const allActive = activeTypes.size === 5;
      ['project','color','font','component','inspiration'].forEach(t => allActive ? activeTypes.delete(t) : activeTypes.add(t));
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', !allActive));
    } else {
      if (activeTypes.has(type)) activeTypes.delete(type); else activeTypes.add(type);
      btn.classList.toggle('active');
    }
    document.querySelector('[data-type="all"]').classList.toggle('active', activeTypes.size === 5);
    updateVisibility();
  });
});

searchInput.addEventListener('input', () => {
  searchTerm = searchInput.value.trim().toLowerCase();
  updateVisibility();
});

// Camera
let camX = 0, camY = 0, camZoom = 1;
function screenToWorld(sx, sy) {
  return { x: (sx - W/2) / camZoom + W/2 - camX, y: (sy - H/2) / camZoom + H/2 - camY };
}
function worldToScreen(wx, wy) {
  return { x: (wx - W/2 + camX) * camZoom + W/2, y: (wy - H/2 + camY) * camZoom + H/2 };
}

// Physics
const REPULSION = 800;
const ATTRACTION = 0.003;
const DAMPING = 0.85;
const CENTER_GRAVITY = 0.0003;
const EDGE_LENGTH = 120;

function simulate() {
  // Repulsion between visible nodes
  for (let i = 0; i < nodes.length; i++) {
    if (!nodes[i].visible) continue;
    for (let j = i + 1; j < nodes.length; j++) {
      if (!nodes[j].visible) continue;
      let dx = nodes[j].x - nodes[i].x;
      let dy = nodes[j].y - nodes[i].y;
      let dist = Math.sqrt(dx*dx + dy*dy) || 1;
      let force = REPULSION / (dist * dist);
      let fx = dx / dist * force;
      let fy = dy / dist * force;
      nodes[i].vx -= fx;
      nodes[i].vy -= fy;
      nodes[j].vx += fx;
      nodes[j].vy += fy;
    }
  }

  // Attraction along edges
  for (const e of edges) {
    if (!e.sourceNode.visible || !e.targetNode.visible) continue;
    let dx = e.targetNode.x - e.sourceNode.x;
    let dy = e.targetNode.y - e.sourceNode.y;
    let dist = Math.sqrt(dx*dx + dy*dy) || 1;
    let force = (dist - EDGE_LENGTH) * ATTRACTION;
    let fx = dx / dist * force;
    let fy = dy / dist * force;
    e.sourceNode.vx += fx;
    e.sourceNode.vy += fy;
    e.targetNode.vx -= fx;
    e.targetNode.vy -= fy;
  }

  // Center gravity + integration
  for (const n of nodes) {
    if (!n.visible) continue;
    if (n === dragNode) continue;
    n.vx += (W/2 - n.x) * CENTER_GRAVITY;
    n.vy += (H/2 - n.y) * CENTER_GRAVITY;
    n.vx *= DAMPING;
    n.vy *= DAMPING;
    n.x += n.vx;
    n.y += n.vy;
  }
}

// Rendering
function draw() {
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W/2, H/2);
  ctx.scale(camZoom, camZoom);
  ctx.translate(-W/2 + camX, -H/2 + camY);

  // Edges
  for (const e of edges) {
    if (!e.sourceNode.visible || !e.targetNode.visible) continue;
    ctx.beginPath();
    ctx.moveTo(e.sourceNode.x, e.sourceNode.y);
    ctx.lineTo(e.targetNode.x, e.targetNode.y);
    const isShared = e.type === 'shared_token';
    ctx.strokeStyle = isShared ? 'rgba(251,191,36,0.3)' : 'rgba(100,100,140,0.15)';
    ctx.lineWidth = isShared ? 2 : 0.8;
    if (isShared) ctx.setLineDash([4, 4]); else ctx.setLineDash([]);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Nodes
  for (const n of nodes) {
    if (!n.visible) continue;
    const r = n.size * (n.highlighted ? 1.3 : 1);

    // Glow for highlighted
    if (n.highlighted) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, r + 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(99,102,241,0.2)';
      ctx.fill();
    }

    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);

    if (n.type === 'color') {
      ctx.fillStyle = n.color;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillStyle = n.color;
      ctx.fill();
    }

    // Label
    const fontSize = n.type === 'project' ? 12 : n.type === 'inspiration' ? 8 : 10;
    ctx.font = (n.type === 'project' ? '600 ' : '') + fontSize + 'px system-ui';
    ctx.fillStyle = n.highlighted ? '#fff' : 'rgba(226,232,240,0.8)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(n.label, n.x, n.y + r + 4);
  }

  ctx.restore();
}

// Interaction
let dragNode = null;
let isPanning = false;
let lastMouse = { x: 0, y: 0 };
let hoverNode = null;

function findNode(mx, my) {
  const w = screenToWorld(mx, my);
  for (let i = nodes.length - 1; i >= 0; i--) {
    if (!nodes[i].visible) continue;
    const dx = w.x - nodes[i].x;
    const dy = w.y - nodes[i].y;
    if (dx*dx + dy*dy < (nodes[i].size + 4) ** 2) return nodes[i];
  }
  return null;
}

canvas.addEventListener('mousedown', e => {
  const node = findNode(e.clientX, e.clientY);
  if (node) {
    dragNode = node;
    canvas.style.cursor = 'grabbing';
  } else {
    isPanning = true;
    canvas.style.cursor = 'grabbing';
  }
  lastMouse = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('mousemove', e => {
  if (dragNode) {
    const w = screenToWorld(e.clientX, e.clientY);
    dragNode.x = w.x;
    dragNode.y = w.y;
    dragNode.vx = 0;
    dragNode.vy = 0;
  } else if (isPanning) {
    camX += (e.clientX - lastMouse.x) / camZoom;
    camY += (e.clientY - lastMouse.y) / camZoom;
  } else {
    const node = findNode(e.clientX, e.clientY);
    if (node !== hoverNode) {
      hoverNode = node;
      if (node) {
        canvas.style.cursor = 'pointer';
        const tt = tooltip;
        tt.style.display = 'block';
        tt.style.left = (e.clientX + 14) + 'px';
        tt.style.top = (e.clientY + 14) + 'px';
        tt.querySelector('.tt-title').textContent = node.label;
        tt.querySelector('.tt-type').textContent = node.type;
        const metaLines = Object.entries(node.meta).map(([k,v]) => v ? k + ': ' + v : '').filter(Boolean).join('\\n');
        tt.querySelector('.tt-meta').textContent = metaLines;
      } else {
        canvas.style.cursor = 'grab';
        tooltip.style.display = 'none';
      }
    }
    if (hoverNode) {
      tooltip.style.left = (e.clientX + 14) + 'px';
      tooltip.style.top = (e.clientY + 14) + 'px';
    }
  }
  lastMouse = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('mouseup', () => {
  dragNode = null;
  isPanning = false;
  canvas.style.cursor = hoverNode ? 'pointer' : 'grab';
});

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const factor = e.deltaY > 0 ? 0.92 : 1.08;
  camZoom = Math.max(0.1, Math.min(5, camZoom * factor));
}, { passive: false });

// Animation loop
function loop() {
  simulate();
  draw();
  const visibleNodes = nodes.filter(n => n.visible).length;
  const visibleEdges = edges.filter(e => e.sourceNode.visible && e.targetNode.visible).length;
  statsEl.textContent = visibleNodes + ' nodes · ' + visibleEdges + ' edges';
  requestAnimationFrame(loop);
}
updateVisibility();
loop();
</script>
</body>
</html>`;
}
