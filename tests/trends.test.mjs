import test from 'node:test';
import assert from 'node:assert/strict';
import { detectTrends } from '../dist/trends.js';

test('detectTrends finds colors appearing in 3+ captures', () => {
  const inspirations = [
    { id: 'a', name: 'A', capturedAt: '2026-01-01', sourceType: 'url', tags: [], fingerprint: 'a', version: 1, analysis: { colors: [{ hex: '#FF0000', count: 5, samples: [] }], typography: [], components: [], motion: [], layout: [], cssVariables: {} } },
    { id: 'b', name: 'B', capturedAt: '2026-01-15', sourceType: 'url', tags: [], fingerprint: 'b', version: 1, analysis: { colors: [{ hex: '#FF0000', count: 3, samples: [] }], typography: [], components: [], motion: [], layout: [], cssVariables: {} } },
    { id: 'c', name: 'C', capturedAt: '2026-02-01', sourceType: 'url', tags: [], fingerprint: 'c', version: 1, analysis: { colors: [{ hex: '#FF0000', count: 8, samples: [] }], typography: [], components: [], motion: [], layout: [], cssVariables: {} } },
  ];

  const trends = detectTrends(inspirations);
  const colorTrend = trends.find((t) => t.domain === 'color');
  assert.ok(colorTrend);
  assert.equal(colorTrend.occurrences, 3);
  assert.equal(colorTrend.signal, 'rising');
});

test('detectTrends finds component kind trends', () => {
  const inspirations = [
    { id: 'a', name: 'A', capturedAt: '2026-01-01', sourceType: 'url', tags: [], fingerprint: 'a', version: 1, analysis: { colors: [], typography: [], components: [{ kind: 'card', tag: 'div', selector: '.card', text: '', className: '', styles: {} }], motion: [], layout: [], cssVariables: {} } },
    { id: 'b', name: 'B', capturedAt: '2026-01-15', sourceType: 'url', tags: [], fingerprint: 'b', version: 1, analysis: { colors: [], typography: [], components: [{ kind: 'card', tag: 'div', selector: '.card2', text: '', className: '', styles: {} }], motion: [], layout: [], cssVariables: {} } },
    { id: 'c', name: 'C', capturedAt: '2026-02-01', sourceType: 'url', tags: [], fingerprint: 'c', version: 1, analysis: { colors: [], typography: [], components: [{ kind: 'card', tag: 'div', selector: '.card3', text: '', className: '', styles: {} }], motion: [], layout: [], cssVariables: {} } },
  ];

  const trends = detectTrends(inspirations);
  const componentTrend = trends.find((t) => t.domain === 'components');
  assert.ok(componentTrend);
  assert.ok(componentTrend.title.includes('card'));
});

test('detectTrends returns empty for insufficient data', () => {
  const inspirations = [
    { id: 'a', name: 'A', capturedAt: '2026-01-01', sourceType: 'url', tags: [], fingerprint: 'a', version: 1, analysis: { colors: [{ hex: '#FF0000', count: 5, samples: [] }], typography: [], components: [], motion: [], layout: [], cssVariables: {} } },
  ];

  const trends = detectTrends(inspirations);
  assert.equal(trends.length, 0);
});
