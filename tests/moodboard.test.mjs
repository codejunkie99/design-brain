import test from 'node:test';
import assert from 'node:assert/strict';
import { generateMoodboardHtml, generateMoodboardSvg } from '../dist/moodboard.js';

const makeProject = () => ({
  id: 'test', name: 'Test Project', createdAt: '', updatedAt: '',
  inspirations: [{
    id: 'inspo-1', name: 'Stripe', sourceType: 'url', capturedAt: '', tags: [],
    fingerprint: 'abc', version: 1,
    analysis: {
      colors: [
        { hex: '#533AFD', count: 100, samples: ['a:color'] },
        { hex: '#000000', count: 200, samples: ['div:color'] },
      ],
      typography: [{ fontFamily: 'sohne-var, sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '24px', count: 50 }],
      components: [
        { kind: 'button', tag: 'button', selector: '.btn', text: 'Click', className: 'btn', styles: {} },
        { kind: 'card', tag: 'div', selector: '.card', text: '', className: 'card', styles: {} },
      ],
      motion: [{
        selector: '.btn', transition: 'all 0.3s ease', animation: 'none', transform: 'none',
        transitions: [{ property: 'all', duration: '0.3s', timingFunction: 'ease', delay: '0s' }],
      }],
      layout: [], cssVariables: {},
    },
  }],
  outcomes: [],
});

test('generateMoodboardHtml produces valid HTML with sections', () => {
  const html = generateMoodboardHtml(makeProject());
  assert.ok(html.includes('<!DOCTYPE html>'));
  assert.ok(html.includes('Test Project'));
  assert.ok(html.includes('#533AFD'));
  assert.ok(html.includes('sohne-var'));
  assert.ok(html.includes('button'));
});

test('generateMoodboardSvg produces valid SVG', () => {
  const svg = generateMoodboardSvg(makeProject());
  assert.ok(svg.includes('<svg'));
  assert.ok(svg.includes('Test Project'));
  assert.ok(svg.includes('#533AFD'));
});

test('generateMoodboardHtml handles empty project', () => {
  const project = { id: 'test', name: 'Empty', createdAt: '', updatedAt: '', inspirations: [], outcomes: [] };
  const html = generateMoodboardHtml(project);
  assert.ok(html.includes('Empty'));
  assert.ok(html.includes('No captures'));
});
