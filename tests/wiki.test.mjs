import test from 'node:test';
import assert from 'node:assert/strict';
import { generateProjectWiki, generateSharedContextWiki, generateWikiIndex, countSharedTokens } from '../dist/wiki.js';

const makeInspo = (overrides) => ({
  id: 'inspo-1', name: 'Test', sourceType: 'url', capturedAt: '2026-01-15T00:00:00Z', tags: ['web'],
  fingerprint: 'abc', version: 1,
  analysis: {
    colors: [], typography: [], components: [], motion: [], layout: [],
    cssVariables: {},
  },
  ...overrides,
});

const makeProject = (id, name, inspos) => ({
  id, name, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-15T00:00:00Z',
  description: `${name} project`,
  inspirations: inspos, outcomes: [],
});

test('generateProjectWiki produces markdown with all sections', () => {
  const project = makeProject('stripe', 'Stripe', [
    makeInspo({
      id: 'inspo-stripe-1', name: 'Stripe Homepage', url: 'https://stripe.com',
      analysis: {
        colors: [{ hex: '#635BFF', count: 10, samples: ['bg'] }, { hex: '#0A2540', count: 8, samples: ['text'] }],
        typography: [{ fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '24px', count: 5 }],
        components: [{ kind: 'button', tag: 'button', selector: '.btn', text: 'Get started', className: 'btn', styles: {} }],
        motion: [{ selector: '.card', transition: 'all 0.3s ease', animation: '', transform: '', transitions: [] }],
        layout: [], cssVariables: { '--color-primary': '#635BFF' },
      },
    }),
  ]);

  const md = generateProjectWiki(project, ['stripe', 'shopify']);
  assert.ok(md.includes('# Stripe'));
  assert.ok(md.includes('## Colors'));
  assert.ok(md.includes('#635BFF'));
  assert.ok(md.includes('## Typography'));
  assert.ok(md.includes('Inter'));
  assert.ok(md.includes('## Components'));
  assert.ok(md.includes('button'));
  assert.ok(md.includes('## Motion'));
  assert.ok(md.includes('## CSS Variables'));
  assert.ok(md.includes('--color-primary'));
  assert.ok(md.includes('## Inspirations'));
  assert.ok(md.includes('Stripe Homepage'));
  assert.ok(md.includes('## See Also'));
  assert.ok(md.includes('[[shopify]]'));
  assert.ok(md.includes('[[shared-context]]'));
});

test('generateSharedContextWiki finds shared colors across projects', () => {
  const projectA = makeProject('stripe', 'Stripe', [
    makeInspo({
      id: 'i1',
      analysis: {
        colors: [{ hex: '#FF0000', count: 5, samples: [] }, { hex: '#00FF00', count: 3, samples: [] }],
        typography: [{ fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '24px', count: 5 }],
        components: [{ kind: 'button', tag: 'button', selector: '.btn', text: '', className: '', styles: {} }],
        motion: [], layout: [], cssVariables: {},
      },
    }),
  ]);
  const projectB = makeProject('shopify', 'Shopify', [
    makeInspo({
      id: 'i2',
      analysis: {
        colors: [{ hex: '#FF0000', count: 8, samples: [] }, { hex: '#0000FF', count: 4, samples: [] }],
        typography: [{ fontFamily: 'Inter', fontSize: '14px', fontWeight: '400', lineHeight: '20px', count: 3 }],
        components: [{ kind: 'button', tag: 'button', selector: '.btn-2', text: '', className: '', styles: {} }],
        motion: [], layout: [], cssVariables: {},
      },
    }),
  ]);

  const md = generateSharedContextWiki([projectA, projectB]);
  assert.ok(md.includes('# Shared Design Context'));
  assert.ok(md.includes('#FF0000'));
  assert.ok(md.includes('[[stripe]]'));
  assert.ok(md.includes('[[shopify]]'));
  assert.ok(md.includes('Inter'));
  assert.ok(md.includes('button'));
});

test('generateSharedContextWiki handles single project gracefully', () => {
  const project = makeProject('solo', 'Solo', [
    makeInspo({
      analysis: {
        colors: [{ hex: '#FF0000', count: 5, samples: [] }],
        typography: [], components: [], motion: [], layout: [], cssVariables: {},
      },
    }),
  ]);

  const md = generateSharedContextWiki([project]);
  assert.ok(md.includes('# Shared Design Context'));
  // No shared tokens with just one project
  assert.ok(md.includes('| **Total** | **0** |'));
});

test('generateWikiIndex lists all projects', () => {
  const projects = [
    makeProject('stripe', 'Stripe', [makeInspo({})]),
    makeProject('shopify', 'Shopify', [makeInspo({}), makeInspo({ id: 'i2' })]),
  ];

  const md = generateWikiIndex(projects, 5);
  assert.ok(md.includes('# Design Wiki'));
  assert.ok(md.includes('[[stripe]]'));
  assert.ok(md.includes('[[shopify]]'));
  assert.ok(md.includes('5 shared tokens'));
});

test('countSharedTokens returns correct total', () => {
  const projectA = makeProject('a', 'A', [
    makeInspo({
      analysis: {
        colors: [{ hex: '#FF0000', count: 5, samples: [] }],
        typography: [{ fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '24px', count: 5 }],
        components: [], motion: [], layout: [], cssVariables: {},
      },
    }),
  ]);
  const projectB = makeProject('b', 'B', [
    makeInspo({
      analysis: {
        colors: [{ hex: '#FF0000', count: 3, samples: [] }],
        typography: [{ fontFamily: 'Roboto', fontSize: '14px', fontWeight: '400', lineHeight: '20px', count: 3 }],
        components: [], motion: [], layout: [], cssVariables: {},
      },
    }),
  ]);

  const count = countSharedTokens([projectA, projectB]);
  // #FF0000 is shared, fonts are different
  assert.ok(count >= 1);
});
