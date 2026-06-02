import test from 'node:test';
import assert from 'node:assert/strict';
import { scanCssContent, scoreAgainstProject, renderScorecard } from '../dist/scorecard.js';

const makeProject = () => ({
  id: 'test-project',
  name: 'Test Project',
  createdAt: '',
  updatedAt: '',
  inspirations: [{
    id: 'inspo-1',
    name: 'Inspo',
    sourceType: 'url',
    capturedAt: '',
    tags: [],
    fingerprint: 'abc',
    version: 1,
    analysis: {
      colors: [{ hex: '#FF0000', count: 10, samples: [] }],
      typography: [{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '24px', count: 5 }],
      components: [
        { kind: 'button', tag: 'button', selector: '.btn', text: '', className: 'btn', styles: {} },
        { kind: 'card', tag: 'div', selector: '.card', text: '', className: 'card', styles: {} },
      ],
      motion: [{
        selector: '.btn',
        transition: 'all 0.3s ease',
        animation: 'none',
        transform: 'none',
        transitions: [{ property: 'all', duration: '0.3s', timingFunction: 'ease', delay: '0s' }],
      }],
      layout: [],
      cssVariables: {},
    },
  }],
  outcomes: [],
});

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

test('scoreAgainstProject matches rgb colors to hex palette', () => {
  const score = scoreAgainstProject({
    colors: ['rgb(255, 0, 0)'],
    fontFamilies: [],
    fontSizes: [],
    transitions: [],
  }, makeProject());

  assert.equal(score.colorScore.onPalette, 1);
  assert.equal(score.colorScore.offPalette, 0);
});

test('scoreAgainstProject preserves file and line details from occurrences', () => {
  const score = scoreAgainstProject({
    colors: ['#00FF00'],
    colorOccurrences: [{ value: '#00FF00', file: 'src/app.css', line: 7 }],
    fontFamilies: [],
    fontSizes: [],
    transitions: [],
  }, makeProject());

  assert.equal(score.colorScore.offPalette, 1);
  assert.equal(score.colorScore.details[0].file, 'src/app.css');
  assert.equal(score.colorScore.details[0].line, 7);
});

test('scoreAgainstProject computes component coverage from source text', () => {
  const score = scoreAgainstProject({
    colors: [],
    fontFamilies: [],
    fontSizes: [],
    transitions: [],
    sourceText: '<button class="btn">Click</button>',
  }, makeProject());

  assert.ok(score.componentScore.coveredKinds.includes('button'));
  assert.ok(score.componentScore.missingKinds.includes('card'));
});
