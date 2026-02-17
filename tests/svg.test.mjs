import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePaletteSvg } from '../dist/svg.js';

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
