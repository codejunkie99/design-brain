import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTailwindConfig } from '../dist/tailwind.js';

test('generateTailwindConfig extracts colors from cssVariables', () => {
  const project = {
    id: 'test',
    name: 'Test',
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
          colors: [{ hex: '#0055FF', count: 5, samples: [] }],
          typography: [],
          components: [],
          motion: [],
          layout: [],
          cssVariables: {
            '--hds-color-accent-default': '#533afd',
            '--brand-bg-primary': '#0055FF',
            '--layout-max-width': '1200px',
          },
        },
      },
    ],
    outcomes: [],
  };

  const config = generateTailwindConfig(project);

  // Should contain color-related vars
  assert.ok(config.includes('accent-default'));
  assert.ok(config.includes('#533afd'));
  assert.ok(config.includes('bg-primary'));
  assert.ok(config.includes('#0055FF'));

  // Should NOT contain non-color vars
  assert.ok(!config.includes('layout-max-width'));
  assert.ok(!config.includes('1200px'));

  // Should be valid JS module syntax
  assert.ok(config.includes('export default'));
  assert.ok(config.includes('theme'));
  assert.ok(config.includes('colors'));
});

test('generateTailwindConfig falls back to numbered colors for unnamed hex values', () => {
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
          colors: [
            { hex: '#FF0000', count: 10, samples: [] },
            { hex: '#00FF00', count: 5, samples: [] },
          ],
          typography: [],
          components: [],
          motion: [],
          layout: [],
          cssVariables: {},
        },
      },
    ],
    outcomes: [],
  };

  const config = generateTailwindConfig(project);

  assert.ok(config.includes("'color-1'"));
  assert.ok(config.includes('#FF0000'));
  assert.ok(config.includes("'color-2'"));
  assert.ok(config.includes('#00FF00'));
});

test('generateTailwindConfig extracts typography', () => {
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
          typography: [
            { fontFamily: '"sohne", sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '1.5', count: 10 },
            { fontFamily: '"sohne", sans-serif', fontSize: '26px', fontWeight: '300', lineHeight: '1.2', count: 5 },
            { fontFamily: 'monospace', fontSize: '14px', fontWeight: '400', lineHeight: '1.4', count: 3 },
          ],
          components: [],
          motion: [],
          layout: [],
          cssVariables: {},
        },
      },
    ],
    outcomes: [],
  };

  const config = generateTailwindConfig(project);

  // Font families
  assert.ok(config.includes('fontFamily'));
  assert.ok(config.includes('sohne'));
  assert.ok(config.includes('monospace'));

  // Font sizes (unique values)
  assert.ok(config.includes('fontSize'));
  assert.ok(config.includes("'16'"));
  assert.ok(config.includes("'26'"));
  assert.ok(config.includes("'14'"));
});

test('generateTailwindConfig deduplicates colors by hex', () => {
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
          colors: [{ hex: '#533afd', count: 10, samples: [] }],
          typography: [],
          components: [],
          motion: [],
          layout: [],
          cssVariables: {
            '--color-accent': '#533afd',
          },
        },
      },
    ],
    outcomes: [],
  };

  const config = generateTailwindConfig(project);

  // #533afd should appear only once as a value (the named version wins)
  const matches = config.match(/#533afd/gi);
  assert.equal(matches?.length, 1);
});

test('generateTailwindConfig handles empty project', () => {
  const project = {
    id: 'empty',
    name: 'Empty',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    inspirations: [],
    outcomes: [],
  };

  const config = generateTailwindConfig(project);

  assert.ok(config.includes('export default'));
  assert.ok(config.includes('colors'));
  assert.ok(config.includes('fontFamily'));
  assert.ok(config.includes('fontSize'));
});

// Integration test
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { renderAll } from '../dist/render.js';

test('renderAll generates tailwind.config.js', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'design-brain-tw-'));
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
          colors: [{ hex: '#0055FF', count: 5, samples: [] }],
          typography: [
            { fontFamily: '"sohne", sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '1.5', count: 10 },
          ],
          components: [],
          motion: [],
          layout: [],
          cssVariables: {
            '--brand-color-primary': '#533afd',
          },
        },
      }],
      outcomes: [],
    }],
  };

  await fs.writeFile(path.join(brain, 'database.json'), JSON.stringify(db, null, 2));
  await renderAll(root, db);

  const twPath = path.join(brain, 'projects', 'test-proj', 'tailwind.config.js');
  const content = await fs.readFile(twPath, 'utf-8');

  assert.ok(content.includes('export default'));
  assert.ok(content.includes('#533afd'));
  assert.ok(content.includes('#0055FF'));
  assert.ok(content.includes('sohne'));
  assert.ok(content.includes("'16'"));

  // Check README has link
  const readme = await fs.readFile(path.join(brain, 'projects', 'test-proj', 'README.md'), 'utf-8');
  assert.ok(readme.includes('tailwind.config.js'));
});
