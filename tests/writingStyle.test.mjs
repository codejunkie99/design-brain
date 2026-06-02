import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeWritingStyle, aggregateWritingStyles, renderWritingStyleMd } from '../dist/writingStyle.js';

const makeInspo = (overrides) => ({
  id: 'inspo-1', name: 'Test', sourceType: 'url', capturedAt: '2026-01-15T00:00:00Z', tags: [],
  fingerprint: 'abc', version: 1,
  analysis: {
    colors: [], typography: [], components: [], motion: [], layout: [],
    cssVariables: {},
  },
  ...overrides,
});

test('analyzeWritingStyle extracts heading patterns', () => {
  const inspo = makeInspo({
    analysis: {
      colors: [], typography: [], motion: [], layout: [], cssVariables: {},
      components: [
        { kind: 'heading', tag: 'h1', selector: 'h1', text: 'Build your dream website', className: '', styles: {} },
        { kind: 'heading', tag: 'h2', selector: 'h2.sub', text: 'How does it work?', className: '', styles: {} },
        { kind: 'heading', tag: 'h3', selector: 'h3', text: 'Features', className: '', styles: {} },
      ],
    },
  });

  const style = analyzeWritingStyle(inspo);
  assert.equal(style.headings.length, 3);
  assert.equal(style.headings[0].style, 'action'); // "Build..."
  assert.equal(style.headings[1].style, 'question'); // "How...?"
  assert.equal(style.headings[2].style, 'label'); // "Features" (1 word)
});

test('analyzeWritingStyle extracts CTA patterns with action verbs', () => {
  const inspo = makeInspo({
    analysis: {
      colors: [], typography: [], motion: [], layout: [], cssVariables: {},
      components: [
        { kind: 'button', tag: 'button', selector: '.cta', text: 'Get started free', className: 'cta', styles: {} },
        { kind: 'link', tag: 'a', selector: '.link', text: 'Learn more', className: 'link', styles: {} },
        { kind: 'button', tag: 'button', selector: '.submit', text: 'Submit', className: 'submit', styles: {} },
      ],
    },
  });

  const style = analyzeWritingStyle(inspo);
  assert.equal(style.ctas.length, 3);
  assert.equal(style.ctas[0].actionVerb, 'get');
  assert.equal(style.ctas[1].actionVerb, 'learn');
  assert.equal(style.ctas[2].actionVerb, 'submit');
});

test('analyzeWritingStyle detects tone markers', () => {
  const inspo = makeInspo({
    analysis: {
      colors: [], typography: [], motion: [], layout: [], cssVariables: {},
      components: [
        { kind: 'text', tag: 'p', selector: 'p', text: "You'll love our amazing product. It's easy to get started and you're going to enjoy every moment.", className: '', styles: {} },
        { kind: 'text', tag: 'p', selector: 'p.2', text: "We're here to help you build something awesome. Let's do this together.", className: '', styles: {} },
      ],
    },
  });

  const style = analyzeWritingStyle(inspo);
  assert.ok(style.toneMarkers.includes('conversational'));
  assert.ok(style.toneMarkers.includes('friendly'));
});

test('analyzeWritingStyle computes text hierarchy', () => {
  const inspo = makeInspo({
    analysis: {
      colors: [], typography: [], motion: [], layout: [], cssVariables: {},
      components: [
        { kind: 'heading', tag: 'h1', selector: 'h1', text: 'Welcome to our platform', className: '', styles: {} },
        { kind: 'text', tag: 'p', selector: 'p.1', text: 'This is a paragraph with some longer text that describes the product features.', className: '', styles: {} },
        { kind: 'text', tag: 'p', selector: 'p.2', text: 'Another paragraph here with details.', className: '', styles: {} },
        { kind: 'button', tag: 'button', selector: '.btn', text: 'Sign up', className: '', styles: {} },
      ],
    },
  });

  const style = analyzeWritingStyle(inspo);
  assert.ok(style.textHierarchy.length > 0);
  const h1Level = style.textHierarchy.find(l => l.level === 'h1');
  assert.ok(h1Level);
  assert.equal(h1Level.count, 1);
  const pLevel = style.textHierarchy.find(l => l.level === 'p');
  assert.ok(pLevel);
  assert.equal(pLevel.count, 2);
});

test('aggregateWritingStyles combines across multiple captures', () => {
  const inspos = [
    makeInspo({
      id: 'i1',
      analysis: {
        colors: [], typography: [], motion: [], layout: [], cssVariables: {},
        components: [
          { kind: 'heading', tag: 'h1', selector: 'h1', text: 'Get started today', className: '', styles: {} },
          { kind: 'button', tag: 'button', selector: '.cta', text: 'Start free trial', className: '', styles: {} },
          { kind: 'text', tag: 'p', selector: 'p', text: "You'll love building with our amazing tools.", className: '', styles: {} },
        ],
      },
    }),
    makeInspo({
      id: 'i2',
      analysis: {
        colors: [], typography: [], motion: [], layout: [], cssVariables: {},
        components: [
          { kind: 'heading', tag: 'h1', selector: 'h1', text: 'Start free trial', className: '', styles: {} },
          { kind: 'button', tag: 'button', selector: '.cta', text: 'Start free trial', className: '', styles: {} },
          { kind: 'text', tag: 'p', selector: 'p', text: "It's easy to deploy your API and configure your SDK.", className: '', styles: {} },
        ],
      },
    }),
  ];

  const agg = aggregateWritingStyles(inspos);
  assert.ok(Object.keys(agg.headingStyles).length > 0);
  assert.ok(agg.topCtas.length > 0);
  // "Start free trial" appears in both
  const startCta = agg.topCtas.find(c => c.text.toLowerCase() === 'start free trial');
  assert.ok(startCta);
  assert.equal(startCta.count, 2);
  assert.ok(Object.keys(agg.tones).length > 0);
});

test('renderWritingStyleMd produces searchable markdown', () => {
  const inspos = [
    makeInspo({
      analysis: {
        colors: [], typography: [], motion: [], layout: [], cssVariables: {},
        components: [
          { kind: 'heading', tag: 'h1', selector: 'h1', text: 'Build something great', className: '', styles: {} },
          { kind: 'button', tag: 'button', selector: '.cta', text: 'Get started', className: '', styles: {} },
          { kind: 'text', tag: 'p', selector: 'p', text: "You'll love how easy it is to get started.", className: '', styles: {} },
        ],
      },
    }),
  ];

  const agg = aggregateWritingStyles(inspos);
  const md = renderWritingStyleMd(agg, 'test-project');
  assert.ok(md.includes('# Writing Style Analysis'));
  assert.ok(md.includes('## Tone'));
  assert.ok(md.includes('## Heading Patterns'));
  assert.ok(md.includes('## CTA Patterns'));
  assert.ok(md.includes('Get started'));
  assert.ok(md.includes('## Text Hierarchy'));
});

test('analyzeWritingStyle handles empty components', () => {
  const inspo = makeInspo({});
  const style = analyzeWritingStyle(inspo);
  assert.equal(style.headings.length, 0);
  assert.equal(style.ctas.length, 0);
  assert.equal(style.toneMarkers.length, 0);
});
