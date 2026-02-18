import test from 'node:test';
import assert from 'node:assert/strict';
import { scanCssContent, renderScorecard } from '../dist/scorecard.js';

test('scanCssContent extracts hex colors', () => {
  const css = 'body { color: #333; background: #FF0000; border: 1px solid #533AFD; }';
  const result = scanCssContent(css);
  assert.ok(result.colors.includes('#333'));
  assert.ok(result.colors.includes('#FF0000'));
  assert.ok(result.colors.includes('#533AFD'));
});

test('scanCssContent extracts font families', () => {
  const css = 'body { font-family: Inter, sans-serif; } h1 { font-family: "Playfair Display", serif; }';
  const result = scanCssContent(css);
  assert.ok(result.fontFamilies.some((f) => f.includes('Inter')));
  assert.ok(result.fontFamilies.some((f) => f.includes('Playfair Display')));
});

test('scanCssContent extracts font sizes', () => {
  const css = 'body { font-size: 16px; } h1 { font-size: 32px; }';
  const result = scanCssContent(css);
  assert.ok(result.fontSizes.includes('16px'));
  assert.ok(result.fontSizes.includes('32px'));
});

test('scanCssContent extracts transition durations', () => {
  const css = '.btn { transition: all 0.3s ease; } .card { transition: opacity 200ms linear; }';
  const result = scanCssContent(css);
  assert.ok(result.transitions.length >= 2);
});

test('renderScorecard produces markdown with scores', () => {
  const report = {
    filesScanned: 5,
    colorScore: { onPalette: 8, offPalette: 2, details: [] },
    typographyScore: { onSystem: 3, offSystem: 1, details: [] },
    componentScore: { covered: 5, missing: 3, coveredKinds: [], missingKinds: [] },
    motionScore: { consistent: 4, inconsistent: 1, details: [] },
  };
  const md = renderScorecard(report, 'test-project');
  assert.ok(md.includes('# Design System Scorecard'));
  assert.ok(md.includes('80%'));  // 8/(8+2)
  assert.ok(md.includes('75%'));  // 3/(3+1)
});
