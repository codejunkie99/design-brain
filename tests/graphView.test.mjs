import test from 'node:test';
import assert from 'node:assert/strict';
import { buildKnowledgeGraph, generateGraphHtml } from '../dist/graphView.js';

const makeInspo = (overrides) => ({
  id: 'inspo-1', name: 'Test', sourceType: 'url', capturedAt: '2026-01-15T00:00:00Z', tags: ['web'],
  url: 'https://example.com',
  fingerprint: 'abc', version: 1,
  analysis: {
    colors: [], typography: [], components: [], motion: [], layout: [],
    cssVariables: {},
  },
  ...overrides,
});

const makeProject = (id, name, inspos) => ({
  id, name, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-15T00:00:00Z',
  inspirations: inspos, outcomes: [],
});

const makeDb = (projects) => ({
  version: 1, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-15T00:00:00Z',
  projects,
});

test('buildKnowledgeGraph creates nodes for projects, colors, fonts, components', () => {
  const db = makeDb([
    makeProject('stripe', 'Stripe', [
      makeInspo({
        id: 'i1', name: 'Stripe Homepage',
        analysis: {
          colors: [{ hex: '#635BFF', count: 10, samples: ['bg'] }, { hex: '#0A2540', count: 8, samples: [] }],
          typography: [{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '24px', count: 5 }],
          components: [
            { kind: 'button', tag: 'button', selector: '.btn', text: 'Start', className: 'btn', styles: {} },
            { kind: 'card', tag: 'div', selector: '.card', text: '', className: 'card', styles: {} },
          ],
          motion: [], layout: [], cssVariables: {},
        },
      }),
    ]),
  ]);

  const graph = buildKnowledgeGraph(db);

  // Should have project node
  assert.ok(graph.nodes.some(n => n.id === 'p:stripe' && n.type === 'project'));
  // Should have color nodes
  assert.ok(graph.nodes.some(n => n.type === 'color' && n.meta.hex === '#635BFF'));
  // Should have font node
  assert.ok(graph.nodes.some(n => n.type === 'font' && n.label === 'Inter'));
  // Should have component nodes
  assert.ok(graph.nodes.some(n => n.type === 'component' && n.label === 'button'));
  assert.ok(graph.nodes.some(n => n.type === 'component' && n.label === 'card'));
  // Should have inspiration node
  assert.ok(graph.nodes.some(n => n.type === 'inspiration'));
  // Should have edges
  assert.ok(graph.edges.some(e => e.type === 'has_color'));
  assert.ok(graph.edges.some(e => e.type === 'has_font'));
  assert.ok(graph.edges.some(e => e.type === 'has_component'));
  assert.ok(graph.edges.some(e => e.type === 'has_inspiration'));
});

test('buildKnowledgeGraph detects shared tokens between projects', () => {
  const db = makeDb([
    makeProject('stripe', 'Stripe', [
      makeInspo({
        id: 'i1',
        analysis: {
          colors: [{ hex: '#FF0000', count: 5, samples: [] }],
          typography: [{ fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '24px', count: 3 }],
          components: [{ kind: 'button', tag: 'button', selector: '.btn', text: '', className: '', styles: {} }],
          motion: [], layout: [], cssVariables: {},
        },
      }),
    ]),
    makeProject('shopify', 'Shopify', [
      makeInspo({
        id: 'i2',
        analysis: {
          colors: [{ hex: '#FF0000', count: 8, samples: [] }],
          typography: [{ fontFamily: 'Inter', fontSize: '14px', fontWeight: '400', lineHeight: '20px', count: 4 }],
          components: [{ kind: 'button', tag: 'button', selector: '.btn-2', text: '', className: '', styles: {} }],
          motion: [], layout: [], cssVariables: {},
        },
      }),
    ]),
  ]);

  const graph = buildKnowledgeGraph(db);

  // Should have shared_token edges between the two projects
  const sharedEdges = graph.edges.filter(e => e.type === 'shared_token');
  assert.ok(sharedEdges.length > 0);
  // Both projects share #FF0000, Inter, and button
  const edge = sharedEdges[0];
  assert.ok(edge.weight >= 3); // color + font + component
});

test('buildKnowledgeGraph handles empty database', () => {
  const db = makeDb([]);
  const graph = buildKnowledgeGraph(db);
  assert.equal(graph.nodes.length, 0);
  assert.equal(graph.edges.length, 0);
});

test('buildKnowledgeGraph handles project with no captures', () => {
  const db = makeDb([makeProject('empty', 'Empty', [])]);
  const graph = buildKnowledgeGraph(db);
  assert.equal(graph.nodes.length, 1); // Just the project node
  assert.equal(graph.nodes[0].type, 'project');
});

test('generateGraphHtml produces valid HTML with embedded data', () => {
  const db = makeDb([
    makeProject('test', 'Test', [
      makeInspo({
        analysis: {
          colors: [{ hex: '#FF0000', count: 5, samples: [] }],
          typography: [{ fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '24px', count: 3 }],
          components: [{ kind: 'button', tag: 'button', selector: '.btn', text: '', className: '', styles: {} }],
          motion: [], layout: [], cssVariables: {},
        },
      }),
    ]),
  ]);

  const graph = buildKnowledgeGraph(db);
  const html = generateGraphHtml(graph);

  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('Design Brain'));
  assert.ok(html.includes('Knowledge Graph'));
  assert.ok(html.includes('canvas'));
  assert.ok(html.includes('#FF0000'));
  assert.ok(html.includes('Inter'));
  assert.ok(html.includes('button'));
  // Should have the graph data embedded
  assert.ok(html.includes('"nodes"'));
  assert.ok(html.includes('"edges"'));
});

test('buildKnowledgeGraph limits nodes per project to avoid graph explosion', () => {
  const manyComponents = Array.from({ length: 50 }, (_, i) => ({
    kind: `component-${i}`, tag: 'div', selector: `.c${i}`, text: '', className: '', styles: {},
  }));

  const db = makeDb([
    makeProject('big', 'Big Project', [
      makeInspo({
        analysis: {
          colors: Array.from({ length: 30 }, (_, i) => ({ hex: `#${String(i).padStart(6, '0')}`, count: 1, samples: [] })),
          typography: [],
          components: manyComponents,
          motion: [], layout: [], cssVariables: {},
        },
      }),
    ]),
  ]);

  const graph = buildKnowledgeGraph(db);
  // Colors limited to 8, components to 10
  const colorNodes = graph.nodes.filter(n => n.type === 'color');
  const compNodes = graph.nodes.filter(n => n.type === 'component');
  assert.ok(colorNodes.length <= 8);
  assert.ok(compNodes.length <= 10);
});
