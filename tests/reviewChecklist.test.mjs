import test from 'node:test';
import assert from 'node:assert/strict';
import { buildChecklist, renderChecklist } from '../dist/reviewChecklist.js';

const makeInspo = (overrides) => ({
  id: 'inspo-1', name: 'Test', sourceType: 'url', capturedAt: '', tags: [],
  fingerprint: 'abc', version: 1,
  analysis: {
    colors: [], typography: [], components: [], motion: [], layout: [],
    cssVariables: {},
  },
  ...overrides,
});

const makeProject = (inspos) => ({
  id: 'test', name: 'Test', createdAt: '', updatedAt: '',
  inspirations: inspos, outcomes: [],
});

test('buildChecklist returns pattern items from project data', () => {
  const project = makeProject([
    makeInspo({
      analysis: {
        colors: [{ hex: '#FF0000', count: 10, samples: [] }],
        typography: [{ fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '24px', count: 5 }],
        components: [{ kind: 'button', tag: 'button', selector: '.btn', text: '', className: 'btn', styles: {} }],
        motion: [], layout: [], cssVariables: {},
      },
    }),
  ]);

  const checklist = buildChecklist({ project });
  assert.ok(checklist.items.length > 0);
  assert.ok(checklist.items.some((i) => i.category === 'color'));
  assert.ok(checklist.items.some((i) => i.category === 'typography'));
  assert.ok(checklist.items.some((i) => i.category === 'component'));
});

test('buildChecklist includes scorecard items when codebaseTokens provided', () => {
  const project = makeProject([
    makeInspo({
      analysis: {
        colors: [{ hex: '#FF0000', count: 10, samples: [] }],
        typography: [], components: [], motion: [],
        layout: [], cssVariables: {},
      },
    }),
  ]);

  const codebaseTokens = {
    colors: ['#00FF00'],
    fontFamilies: ['Roboto'],
    fontSizes: ['18px'],
    transitions: [],
  };

  const checklist = buildChecklist({ project, codebaseTokens });
  assert.ok(checklist.items.some((i) => i.category === 'scorecard'));
});

test('renderChecklist produces markdown with checkboxes', () => {
  const project = makeProject([
    makeInspo({
      analysis: {
        colors: [{ hex: '#FF0000', count: 10, samples: [] }],
        typography: [],
        components: [{ kind: 'button', tag: 'button', selector: '.btn', text: '', className: 'btn', styles: {} }],
        motion: [], layout: [], cssVariables: {},
      },
    }),
  ]);

  const checklist = buildChecklist({ project });
  const md = renderChecklist(checklist, 'test');
  assert.ok(md.includes('# Design Review Checklist'));
  assert.ok(md.includes('- [ ]'));
});
