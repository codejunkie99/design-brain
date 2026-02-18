import type { InspirationRecord, ComponentToken } from './types.js';

export interface ComponentEdge {
  parent: string;
  child: string;
  count: number;
  sourceSelectors: string[];
}

export interface CoOccurrence {
  kindA: string;
  kindB: string;
  count: number;
}

export interface ComponentGraph {
  nodes: Array<{ kind: string; count: number }>;
  edges: ComponentEdge[];
  coOccurrences: CoOccurrence[];
}

function findKindForSelector(selectorPart: string, components: ComponentToken[]): string[] {
  const kinds: string[] = [];
  for (const comp of components) {
    const parts = comp.selector.trim().split(/\s+/);
    if (parts.includes(selectorPart)) {
      kinds.push(comp.kind);
    }
  }
  return [...new Set(kinds)];
}

function extractNesting(components: ComponentToken[]): Map<string, Set<string>> {
  const parentChild = new Map<string, Set<string>>();

  for (const comp of components) {
    const parts = comp.selector.trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2) continue;

    for (let i = 0; i < parts.length - 1; i++) {
      const parentKinds = findKindForSelector(parts[i], components);
      const childKinds = findKindForSelector(parts[i + 1], components);

      for (const parentKind of parentKinds) {
        for (const childKind of childKinds) {
          if (parentKind === childKind) continue;
          const children = parentChild.get(parentKind) ?? new Set();
          children.add(childKind);
          parentChild.set(parentKind, children);
        }
      }
    }
  }

  return parentChild;
}

export function buildComponentGraph(inspirations: InspirationRecord[]): ComponentGraph {
  const kindCounts = new Map<string, number>();
  const edgeMap = new Map<string, { parent: string; child: string; count: number; selectors: Set<string> }>();
  const coOccMap = new Map<string, number>();

  for (const inspo of inspirations) {
    const components = inspo.analysis.components;
    const kindsInCapture = new Set<string>();

    for (const comp of components) {
      kindCounts.set(comp.kind, (kindCounts.get(comp.kind) ?? 0) + 1);
      kindsInCapture.add(comp.kind);
    }

    const nesting = extractNesting(components);
    for (const [parent, children] of nesting) {
      for (const child of children) {
        const key = `${parent}→${child}`;
        const existing = edgeMap.get(key) ?? { parent, child, count: 0, selectors: new Set<string>() };
        existing.count += 1;
        existing.selectors.add(inspo.id);
        edgeMap.set(key, existing);
      }
    }

    const kindList = [...kindsInCapture].sort();
    for (let i = 0; i < kindList.length; i++) {
      for (let j = i + 1; j < kindList.length; j++) {
        const key = `${kindList[i]}|${kindList[j]}`;
        coOccMap.set(key, (coOccMap.get(key) ?? 0) + 1);
      }
    }
  }

  const nodes = [...kindCounts.entries()]
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count);

  const edges = [...edgeMap.values()]
    .map((e) => ({ parent: e.parent, child: e.child, count: e.count, sourceSelectors: [...e.selectors] }))
    .sort((a, b) => b.count - a.count);

  const coOccurrences = [...coOccMap.entries()]
    .map(([key, count]) => {
      const [kindA, kindB] = key.split('|');
      return { kindA, kindB, count };
    })
    .sort((a, b) => b.count - a.count);

  return { nodes, edges, coOccurrences };
}

export function renderComponentGraphMd(graph: ComponentGraph): string {
  const lines: string[] = [];
  lines.push('# Component Relationship Graph\n');

  lines.push('## Component Kinds\n');
  lines.push('| Kind | Occurrences |');
  lines.push('| --- | --- |');
  for (const node of graph.nodes) {
    lines.push(`| ${node.kind} | ${node.count} |`);
  }
  lines.push('');

  if (graph.edges.length > 0) {
    lines.push('## Parent-Child Relationships\n');
    lines.push('| Parent | Child | Captures |');
    lines.push('| --- | --- | --- |');
    for (const edge of graph.edges) {
      lines.push(`| ${edge.parent} | ${edge.child} | ${edge.count} |`);
    }
    lines.push('');
  }

  if (graph.coOccurrences.length > 0) {
    lines.push('## Co-Occurrences\n');
    lines.push('| Component A | Component B | Captures |');
    lines.push('| --- | --- | --- |');
    for (const co of graph.coOccurrences.slice(0, 30)) {
      lines.push(`| ${co.kindA} | ${co.kindB} | ${co.count} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
