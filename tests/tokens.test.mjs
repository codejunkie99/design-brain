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

// Integration test
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { renderAll } from '../dist/render.js';

test('renderAll generates component token JSON files', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'design-brain-tokens-'));
  const brain = path.join(root, '.design-brain');
  await fs.mkdir(path.join(brain, 'projects'), { recursive: true });
  await fs.mkdir(path.join(brain, 'assets'), { recursive: true });
  await fs.mkdir(path.join(brain, 'graph'), { recursive: true });

  const db = {
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    projects: [{
      id: 'test-proj',
      name: 'Test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      inspirations: [{
        id: 'inspo-1',
        name: 'Stripe',
        sourceType: 'url',
        capturedAt: new Date().toISOString(),
        tags: [],
        fingerprint: 'abc',
        version: 1,
        analysis: {
          colors: [{ hex: '#0055FF', count: 1, samples: [] }],
          typography: [],
          components: [
            { kind: 'button', tag: 'button', selector: '.btn', text: 'Pay', className: 'btn', styles: { color: '#fff' }, html: '<button class="btn">Pay</button>' },
            { kind: 'card', tag: 'div', selector: '.card', text: 'Feature', className: 'card', styles: {}, html: '<div class="card">Feature</div>' },
          ],
          motion: [],
          layout: [],
          cssVariables: {},
        },
      }],
      outcomes: [],
    }],
  };

  await fs.writeFile(path.join(brain, 'database.json'), JSON.stringify(db, null, 2));
  await renderAll(root, db);

  const tokenDir = path.join(brain, 'projects', 'test-proj', 'tokens', 'components');
  const buttonFile = JSON.parse(await fs.readFile(path.join(tokenDir, 'button.json'), 'utf-8'));
  const cardFile = JSON.parse(await fs.readFile(path.join(tokenDir, 'card.json'), 'utf-8'));

  assert.equal(buttonFile.kind, 'button');
  assert.equal(buttonFile.project, 'test-proj');
  assert.equal(buttonFile.variants.length, 1);
  assert.ok(buttonFile.variants[0].html.includes('btn'));

  assert.equal(cardFile.kind, 'card');
  assert.equal(cardFile.variants.length, 1);
});
