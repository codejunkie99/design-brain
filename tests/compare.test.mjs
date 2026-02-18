import test from 'node:test';
import assert from 'node:assert/strict';
import { compareInspirations, renderComparison } from '../dist/compare.js';

const makeInspo = (overrides) => ({
  id: 'inspo-1', name: 'Test A', sourceType: 'url', capturedAt: '', tags: [],
  fingerprint: 'abc', version: 1,
  analysis: {
    colors: [], typography: [], components: [], motion: [], layout: [],
    cssVariables: {},
  },
  ...overrides,
});

test('compareInspirations detects added and removed colors', () => {
  const a = makeInspo({
    id: 'a', name: 'A',
    analysis: {
      colors: [{ hex: '#FF0000', count: 5, samples: [] }, { hex: '#00FF00', count: 3, samples: [] }],
      typography: [], components: [], motion: [], layout: [], cssVariables: {},
    },
  });
  const b = makeInspo({
    id: 'b', name: 'B',
    analysis: {
      colors: [{ hex: '#FF0000', count: 8, samples: [] }, { hex: '#0000FF', count: 4, samples: [] }],
      typography: [], components: [], motion: [], layout: [], cssVariables: {},
    },
  });

  const report = compareInspirations(a, b);
  assert.equal(report.colors.added.length, 1);
  assert.equal(report.colors.added[0].hex, '#0000FF');
  assert.equal(report.colors.removed.length, 1);
  assert.equal(report.colors.removed[0].hex, '#00FF00');
  assert.equal(report.colors.shared.length, 1);
});

test('compareInspirations detects typography changes', () => {
  const a = makeInspo({
    id: 'a', name: 'A',
    analysis: {
      colors: [], components: [], motion: [], layout: [], cssVariables: {},
      typography: [{ fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '24px', count: 5 }],
    },
  });
  const b = makeInspo({
    id: 'b', name: 'B',
    analysis: {
      colors: [], components: [], motion: [], layout: [], cssVariables: {},
      typography: [
        { fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '24px', count: 8 },
        { fontFamily: 'Roboto', fontSize: '14px', fontWeight: '500', lineHeight: '20px', count: 3 },
      ],
    },
  });

  const report = compareInspirations(a, b);
  assert.equal(report.typography.added.length, 1);
  assert.equal(report.typography.shared.length, 1);
});

test('renderComparison produces markdown', () => {
  const a = makeInspo({ id: 'a', name: 'A' });
  const b = makeInspo({ id: 'b', name: 'B' });
  const report = compareInspirations(a, b);
  const md = renderComparison(report);
  assert.ok(md.includes('# Compare:'));
  assert.ok(md.includes('## Summary'));
});
