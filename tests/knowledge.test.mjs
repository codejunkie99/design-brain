import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {
  generateIdentity,
  generateMethodology,
  generateMocHub,
  generateMaintenance,
  ensureKnowledgeFiles,
} from '../dist/knowledge.js';

test('generateIdentity creates markdown with profile data', () => {
  const identity = generateIdentity({
    domains: ['web', 'design-systems'],
    focus: 'Building design systems from inspiration',
    philosophy: 'Form follows function',
    tools: ['Figma', 'Tailwind'],
    team: 'Solo designer-developer',
  });

  assert.ok(identity.includes('# Design Brain Identity'));
  assert.ok(identity.includes('Building design systems from inspiration'));
  assert.ok(identity.includes('- web'));
  assert.ok(identity.includes('- design-systems'));
  assert.ok(identity.includes('Form follows function'));
  assert.ok(identity.includes('Figma'));
  assert.ok(identity.includes('Solo designer-developer'));
});

test('generateIdentity uses defaults when minimal profile', () => {
  const identity = generateIdentity({
    domains: [],
    focus: 'General design work',
  });

  assert.ok(identity.includes('- web'));
  assert.ok(identity.includes('- brand'));
  assert.ok(identity.includes('- mobile'));
  assert.ok(identity.includes('- design-systems'));
});

test('generateMethodology creates pipeline description', () => {
  const methodology = generateMethodology();

  assert.ok(methodology.includes('Capture'));
  assert.ok(methodology.includes('Extract'));
  assert.ok(methodology.includes('Synthesize'));
  assert.ok(methodology.includes('Evolve'));
  assert.ok(methodology.includes('Verify'));
  assert.ok(methodology.includes('Patterns'));
  assert.ok(methodology.includes('Decisions'));
  assert.ok(methodology.includes('Principles'));
});

test('generateMocHub links projects and domain MOCs', () => {
  const db = {
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    projects: [{
      id: 'test',
      name: 'Test Project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      inspirations: [{ id: 'inspo-1' }],
      outcomes: [],
    }],
  };

  const hub = generateMocHub(db);

  assert.ok(hub.includes('# Design Brain Hub'));
  assert.ok(hub.includes('Test Project'));
  assert.ok(hub.includes('1 inspirations'));
  assert.ok(hub.includes('color-systems.md'));
  assert.ok(hub.includes('typography.md'));
  assert.ok(hub.includes('components.md'));
  assert.ok(hub.includes('layout.md'));
  assert.ok(hub.includes('motion.md'));
  assert.ok(hub.includes('brand.md'));
});

test('ensureKnowledgeFiles creates all files on fresh brain', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'design-brain-knowledge-'));
  const brain = path.join(root, '.design-brain');
  await fs.mkdir(path.join(brain, 'self'), { recursive: true });
  await fs.mkdir(path.join(brain, 'notes', 'mocs'), { recursive: true });
  await fs.mkdir(path.join(brain, 'ops'), { recursive: true });

  const db = {
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    projects: [],
  };

  await ensureKnowledgeFiles(root, db);

  // Check self/ files
  const identity = await fs.readFile(path.join(brain, 'self', 'identity.md'), 'utf-8');
  assert.ok(identity.includes('# Design Brain Identity'));

  const methodology = await fs.readFile(path.join(brain, 'self', 'methodology.md'), 'utf-8');
  assert.ok(methodology.includes('# Design Brain Methodology'));

  // Check MOC files
  const hub = await fs.readFile(path.join(brain, 'notes', 'mocs', 'hub.md'), 'utf-8');
  assert.ok(hub.includes('# Design Brain Hub'));

  const colorMoc = await fs.readFile(path.join(brain, 'notes', 'mocs', 'color-systems.md'), 'utf-8');
  assert.ok(colorMoc.includes('# Color Systems'));

  // Check ops/
  const maintenance = await fs.readFile(path.join(brain, 'ops', 'maintenance.md'), 'utf-8');
  assert.ok(maintenance.includes('# Maintenance'));
});

test('ensureKnowledgeFiles does not overwrite existing files', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'design-brain-knowledge-'));
  const brain = path.join(root, '.design-brain');
  await fs.mkdir(path.join(brain, 'self'), { recursive: true });
  await fs.mkdir(path.join(brain, 'notes', 'mocs'), { recursive: true });
  await fs.mkdir(path.join(brain, 'ops'), { recursive: true });

  // Write a custom identity
  await fs.writeFile(path.join(brain, 'self', 'identity.md'), '# Custom Identity\n\nMy custom content.');

  const db = { version: 1, createdAt: '', updatedAt: '', projects: [] };
  await ensureKnowledgeFiles(root, db);

  // Should not have overwritten
  const identity = await fs.readFile(path.join(brain, 'self', 'identity.md'), 'utf-8');
  assert.ok(identity.includes('Custom Identity'));
  assert.ok(!identity.includes('Design Brain Identity'));
});

// Integration: renderAll creates knowledge files
import { renderAll } from '../dist/render.js';

test('renderAll creates knowledge system files', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'design-brain-ks-'));
  const brain = path.join(root, '.design-brain');
  await fs.mkdir(path.join(brain, 'projects'), { recursive: true });
  await fs.mkdir(path.join(brain, 'assets'), { recursive: true });
  await fs.mkdir(path.join(brain, 'graph'), { recursive: true });

  const db = {
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    projects: [{
      id: 'test',
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
          typography: [],
          components: [],
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

  // Knowledge system dirs should exist
  assert.ok(await fs.stat(path.join(brain, 'self')).then(() => true).catch(() => false));
  assert.ok(await fs.stat(path.join(brain, 'notes', 'patterns')).then(() => true).catch(() => false));
  assert.ok(await fs.stat(path.join(brain, 'notes', 'mocs')).then(() => true).catch(() => false));
  assert.ok(await fs.stat(path.join(brain, 'ops', 'queue')).then(() => true).catch(() => false));

  // Knowledge files should exist
  assert.ok(await fs.stat(path.join(brain, 'self', 'identity.md')).then(() => true).catch(() => false));
  assert.ok(await fs.stat(path.join(brain, 'notes', 'mocs', 'hub.md')).then(() => true).catch(() => false));
  assert.ok(await fs.stat(path.join(brain, 'notes', 'mocs', 'color-systems.md')).then(() => true).catch(() => false));

  // Color MOC should reference the Stripe inspiration
  const colorMoc = await fs.readFile(path.join(brain, 'notes', 'mocs', 'color-systems.md'), 'utf-8');
  assert.ok(colorMoc.includes('inspo-1'));
  assert.ok(colorMoc.includes('Stripe'));
});
