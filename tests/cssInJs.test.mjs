import test from 'node:test';
import assert from 'node:assert/strict';
import { generateCssInJsTheme } from '../dist/cssInJs.js';

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

test('generateCssInJsTheme returns theme with colors', () => {
  const project = makeProject([
    makeInspo({
      analysis: {
        colors: [{ hex: '#FF0000', count: 10, samples: [] }, { hex: '#00FF00', count: 5, samples: [] }],
        typography: [], components: [], motion: [], layout: [],
        cssVariables: { '--brand-primary': '#FF0000' },
      },
    }),
  ]);

  const theme = generateCssInJsTheme(project);
  assert.ok(theme.colors);
  assert.ok(Object.keys(theme.colors).length >= 1);
});

test('generateCssInJsTheme includes fontSizes with semantic names', () => {
  const project = makeProject([
    makeInspo({
      analysis: {
        colors: [],
        typography: [
          { fontFamily: 'Inter', fontSize: '12px', fontWeight: '400', lineHeight: '16px', count: 5 },
          { fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '24px', count: 8 },
          { fontFamily: 'Inter', fontSize: '24px', fontWeight: '700', lineHeight: '32px', count: 3 },
        ],
        components: [], motion: [], layout: [], cssVariables: {},
      },
    }),
  ]);

  const theme = generateCssInJsTheme(project);
  assert.ok(theme.fontSizes);
  assert.ok(Object.keys(theme.fontSizes).length > 0);
  const keys = Object.keys(theme.fontSizes);
  const semanticKeys = ['xs', 'sm', 'md', 'lg', 'xl'];
  assert.ok(keys.some((k) => semanticKeys.includes(k)));
});

test('generateCssInJsTheme includes transitions', () => {
  const project = makeProject([
    makeInspo({
      analysis: {
        colors: [], typography: [], components: [], layout: [], cssVariables: {},
        motion: [{
          selector: '.btn', transition: 'all 0.3s ease', animation: '', transform: '',
          transitions: [{ property: 'all', duration: '0.3s', timingFunction: 'ease', delay: '0s' }],
        }],
      },
    }),
  ]);

  const theme = generateCssInJsTheme(project);
  assert.ok(theme.transitions);
  assert.ok(Object.keys(theme.transitions).length > 0);
});

test('generateCssInJsTheme outputs correct shape', () => {
  const project = makeProject([makeInspo({})]);
  const theme = generateCssInJsTheme(project);
  assert.equal(typeof theme.colors, 'object');
  assert.equal(typeof theme.fonts, 'object');
  assert.equal(typeof theme.fontSizes, 'object');
  assert.equal(typeof theme.transitions, 'object');
});
