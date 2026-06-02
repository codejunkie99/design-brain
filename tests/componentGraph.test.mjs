import test from 'node:test';
import assert from 'node:assert/strict';
import { buildComponentGraph, renderComponentGraphMd } from '../dist/componentGraph.js';

const makeInspo = (overrides) => ({
  id: 'inspo-1', name: 'Test', sourceType: 'url', capturedAt: '', tags: [],
  fingerprint: 'abc', version: 1,
  analysis: {
    colors: [], typography: [], components: [], motion: [], layout: [],
    cssVariables: {},
  },
  ...overrides,
});

test('buildComponentGraph detects parent-child from selectors', () => {
  const inspos = [
    makeInspo({
      id: 'i1',
      analysis: {
        colors: [], typography: [], motion: [], layout: [], cssVariables: {},
        components: [
          { kind: 'card', tag: 'div', selector: '.card', text: '', className: 'card', styles: {} },
          { kind: 'button', tag: 'button', selector: '.card .btn', text: '', className: 'btn', styles: {} },
          { kind: 'icon', tag: 'span', selector: '.card .btn .icon', text: '', className: 'icon', styles: {} },
        ],
      },
    }),
  ];

  const graph = buildComponentGraph(inspos);
  assert.ok(graph.nodes.length >= 3);
  const cardToBtn = graph.edges.find((e) => e.parent === 'card' && e.child === 'button');
  assert.ok(cardToBtn);
  const btnToIcon = graph.edges.find((e) => e.parent === 'button' && e.child === 'icon');
  assert.ok(btnToIcon);
});

test('buildComponentGraph tracks co-occurrence counts', () => {
  const inspos = [
    makeInspo({
      id: 'i1',
      analysis: {
        colors: [], typography: [], motion: [], layout: [], cssVariables: {},
        components: [
          { kind: 'card', tag: 'div', selector: '.card', text: '', className: 'card', styles: {} },
          { kind: 'button', tag: 'button', selector: '.btn', text: '', className: 'btn', styles: {} },
        ],
      },
    }),
    makeInspo({
      id: 'i2',
      analysis: {
        colors: [], typography: [], motion: [], layout: [], cssVariables: {},
        components: [
          { kind: 'card', tag: 'div', selector: '.card-2', text: '', className: 'card', styles: {} },
          { kind: 'button', tag: 'button', selector: '.btn-2', text: '', className: 'btn', styles: {} },
        ],
      },
    }),
  ];

  const graph = buildComponentGraph(inspos);
  const coOccurrence = graph.coOccurrences.find(
    (c) => (c.kindA === 'button' && c.kindB === 'card') || (c.kindA === 'card' && c.kindB === 'button')
  );
  assert.ok(coOccurrence);
  assert.equal(coOccurrence.count, 2);
});

test('renderComponentGraphMd produces markdown', () => {
  const inspos = [
    makeInspo({
      analysis: {
        colors: [], typography: [], motion: [], layout: [], cssVariables: {},
        components: [
          { kind: 'card', tag: 'div', selector: '.card', text: '', className: 'card', styles: {} },
          { kind: 'button', tag: 'button', selector: '.card .btn', text: '', className: 'btn', styles: {} },
        ],
      },
    }),
  ];

  const graph = buildComponentGraph(inspos);
  const md = renderComponentGraphMd(graph);
  assert.ok(md.includes('# Component Relationship Graph'));
  assert.ok(md.includes('card'));
  assert.ok(md.includes('button'));
});
