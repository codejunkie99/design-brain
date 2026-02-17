import test from 'node:test';
import assert from 'node:assert/strict';
import { generateComponentTokens } from '../dist/tokens.js';

test('generateComponentTokens groups by kind and deduplicates by selector', () => {
  const project = {
    id: 'test-proj',
    name: 'Test Project',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    inspirations: [
      {
        id: 'inspo-a',
        name: 'Stripe',
        sourceType: 'url',
        capturedAt: new Date().toISOString(),
        tags: [],
        fingerprint: 'abc',
        version: 1,
        analysis: {
          colors: [],
          typography: [],
          components: [
            { kind: 'button', tag: 'button', selector: '.btn-primary', text: 'Submit', className: 'btn-primary', styles: { color: 'rgb(255,255,255)' }, html: '<button class="btn-primary">Submit</button>' },
            { kind: 'button', tag: 'a', selector: '.cta-link', text: 'Learn more', className: 'cta-link', styles: { color: 'rgb(0,0,0)' }, html: '<a class="cta-link">Learn more</a>' },
            { kind: 'card', tag: 'div', selector: '.card', text: 'Feature', className: 'card', styles: { borderRadius: '8px' }, html: '<div class="card">Feature</div>' },
          ],
          motion: [],
          layout: [],
          cssVariables: {},
        },
      },
      {
        id: 'inspo-b',
        name: 'Linear',
        sourceType: 'url',
        capturedAt: new Date().toISOString(),
        tags: [],
        fingerprint: 'def',
        version: 1,
        analysis: {
          colors: [],
          typography: [],
          components: [
            { kind: 'button', tag: 'button', selector: '.btn-primary', text: 'Submit', className: 'btn-primary', styles: { color: 'rgb(255,255,255)' }, html: '<button class="btn-primary">Submit</button>' },
          ],
          motion: [],
          layout: [],
          cssVariables: {},
        },
      },
    ],
    outcomes: [],
  };

  const tokens = generateComponentTokens(project);

  // Should have two kinds
  assert.ok(tokens.button);
  assert.ok(tokens.card);
  assert.equal(Object.keys(tokens).length, 2);

  // Button kind should have 2 variants (deduped .btn-primary)
  assert.equal(tokens.button.kind, 'button');
  assert.equal(tokens.button.project, 'test-proj');
  assert.equal(tokens.button.variants.length, 2);

  // .btn-primary should appear from both sources
  const primaryBtn = tokens.button.variants.find(v => v.selector === '.btn-primary');
  assert.ok(primaryBtn);
  assert.deepEqual(primaryBtn.sources, ['inspo-a', 'inspo-b']);
  assert.ok(primaryBtn.html.includes('btn-primary'));

  // Card kind should have 1 variant
  assert.equal(tokens.card.variants.length, 1);
  assert.deepEqual(tokens.card.variants[0].sources, ['inspo-a']);
});

test('generateComponentTokens handles empty inspirations', () => {
  const project = {
    id: 'empty',
    name: 'Empty',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    inspirations: [],
    outcomes: [],
  };

  const tokens = generateComponentTokens(project);
  assert.deepEqual(tokens, {});
});

test('generateComponentTokens sorts variants by occurrence count', () => {
  const project = {
    id: 'test',
    name: 'Test',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    inspirations: [
      {
        id: 'inspo-a',
        name: 'A',
        sourceType: 'url',
        capturedAt: new Date().toISOString(),
        tags: [],
        fingerprint: 'a',
        version: 1,
        analysis: {
          colors: [],
          typography: [],
          components: [
            { kind: 'button', tag: 'button', selector: '.rare', text: 'Rare', className: 'rare', styles: {} },
            { kind: 'button', tag: 'button', selector: '.common', text: 'Common', className: 'common', styles: {} },
          ],
          motion: [],
          layout: [],
          cssVariables: {},
        },
      },
      {
        id: 'inspo-b',
        name: 'B',
        sourceType: 'url',
        capturedAt: new Date().toISOString(),
        tags: [],
        fingerprint: 'b',
        version: 1,
        analysis: {
          colors: [],
          typography: [],
          components: [
            { kind: 'button', tag: 'button', selector: '.common', text: 'Common', className: 'common', styles: {} },
          ],
          motion: [],
          layout: [],
          cssVariables: {},
        },
      },
    ],
    outcomes: [],
  };

  const tokens = generateComponentTokens(project);

  // .common should be first (2 sources) then .rare (1 source)
  assert.equal(tokens.button.variants[0].selector, '.common');
  assert.equal(tokens.button.variants[1].selector, '.rare');
});
