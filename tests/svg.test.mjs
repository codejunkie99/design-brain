import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePaletteSvg, generateComponentsSvg, generateTypographySvg, generateLayoutSvg } from '../dist/svg.js';

test('generatePaletteSvg returns valid SVG with color rects', () => {
  const colors = [
    { hex: '#0055FF', count: 42, samples: ['button', 'link'] },
    { hex: '#1A1A1A', count: 38, samples: ['text'] },
    { hex: '#F5F5F5', count: 31, samples: ['background'] },
  ];

  const svg = generatePaletteSvg(colors, 'Test Project');

  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.endsWith('</svg>'));
  assert.ok(svg.includes('xmlns="http://www.w3.org/2000/svg"'));
  assert.ok(svg.includes('#0055FF'));
  assert.ok(svg.includes('#1A1A1A'));
  assert.ok(svg.includes('#F5F5F5'));
  assert.ok(svg.includes('42'));
  assert.ok(svg.includes('Test Project'));
});

test('generatePaletteSvg handles empty colors', () => {
  const svg = generatePaletteSvg([], 'Empty');

  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('No colors'));
});

test('generateComponentsSvg groups by kind', () => {
  const components = [
    { kind: 'button', tag: 'button', selector: '.btn-primary', text: 'Submit', className: 'btn-primary', styles: {} },
    { kind: 'button', tag: 'a', selector: '.cta-link', text: 'Learn more', className: 'cta-link', styles: {} },
    { kind: 'card', tag: 'div', selector: '.card-main', text: 'Feature', className: 'card-main', styles: {} },
  ];

  const svg = generateComponentsSvg(components, 'Test Project');

  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('button'));
  assert.ok(svg.includes('card'));
  assert.ok(svg.includes('.btn-primary'));
  assert.ok(svg.includes('Submit'));
});

test('generateComponentsSvg handles empty components', () => {
  const svg = generateComponentsSvg([], 'Empty');

  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('No components'));
});

test('generateTypographySvg groups by font family', () => {
  const typography = [
    { fontFamily: 'Inter', fontSize: '32px', fontWeight: '700', lineHeight: '1.2', count: 8 },
    { fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '1.5', count: 24 },
    { fontFamily: 'Roboto Mono', fontSize: '14px', fontWeight: '400', lineHeight: '1.6', count: 5 },
  ];

  const svg = generateTypographySvg(typography, 'Test Project');

  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('Inter'));
  assert.ok(svg.includes('Roboto Mono'));
  assert.ok(svg.includes('32px'));
  assert.ok(svg.includes('700'));
});

test('generateTypographySvg handles empty typography', () => {
  const svg = generateTypographySvg([], 'Empty');

  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('No typography'));
});

test('generateLayoutSvg renders layout boxes', () => {
  const layout = [
    { tag: 'header', selector: '.site-header', role: 'banner', children: 3 },
    { tag: 'main', selector: '.content', role: 'main', children: 2 },
    { tag: 'aside', selector: '.sidebar', role: 'complementary', children: 4 },
    { tag: 'footer', selector: '.site-footer', role: 'contentinfo', children: 3 },
  ];

  const svg = generateLayoutSvg(layout, 'Test Project');

  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('header'));
  assert.ok(svg.includes('main'));
  assert.ok(svg.includes('.site-header'));
  assert.ok(svg.includes('banner'));
});

test('generateLayoutSvg handles empty layout', () => {
  const svg = generateLayoutSvg([], 'Empty');

  assert.ok(svg.startsWith('<svg'));
  assert.ok(svg.includes('No layout'));
});

// Integration test: renderAll generates SVG files
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { renderAll } from '../dist/render.js';

test('renderAll generates SVG files in visuals directory', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'design-brain-svg-'));
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
      name: 'Test Project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      inspirations: [{
        id: 'inspo-1',
        name: 'Stripe',
        sourceType: 'url',
        capturedAt: new Date().toISOString(),
        tags: ['button'],
        fingerprint: 'abc123',
        version: 1,
        analysis: {
          colors: [{ hex: '#0055FF', count: 10, samples: ['btn'] }],
          typography: [{ fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '1.5', count: 5 }],
          components: [{ kind: 'button', tag: 'button', selector: '.btn', text: 'Pay', className: 'btn', styles: {} }],
          motion: [],
          layout: [{ tag: 'main', selector: '.content', role: 'main', children: 2 }],
          cssVariables: {},
        },
      }],
      outcomes: [],
    }],
  };

  await fs.writeFile(path.join(brain, 'database.json'), JSON.stringify(db, null, 2));
  await renderAll(root, db);

  // Check project-level visuals exist
  const visualDir = path.join(brain, 'projects', 'test-proj', 'visuals');
  const palette = await fs.readFile(path.join(visualDir, 'palette.svg'), 'utf-8');
  const components = await fs.readFile(path.join(visualDir, 'components.svg'), 'utf-8');
  const typography = await fs.readFile(path.join(visualDir, 'typography.svg'), 'utf-8');
  const layout = await fs.readFile(path.join(visualDir, 'layout.svg'), 'utf-8');

  assert.ok(palette.includes('#0055FF'));
  assert.ok(components.includes('button'));
  assert.ok(typography.includes('Inter'));
  assert.ok(layout.includes('main'));

  // Check per-inspiration visuals exist
  const inspoDir = path.join(brain, 'projects', 'test-proj', 'inspirations', 'inspo-1');
  const inspoPalette = await fs.readFile(path.join(inspoDir, 'palette.svg'), 'utf-8');
  assert.ok(inspoPalette.includes('#0055FF'));

  // Check markdown embeds SVG links
  const readme = await fs.readFile(path.join(brain, 'projects', 'test-proj', 'README.md'), 'utf-8');
  assert.ok(readme.includes('palette.svg'));
  assert.ok(readme.includes('Visual Catalog'));
});
