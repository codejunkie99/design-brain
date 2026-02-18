import test from 'node:test';
import assert from 'node:assert/strict';
import { generateStyleDictionary } from '../dist/styleDictionary.js';

test('generateStyleDictionary extracts colors from cssVariables', () => {
  const project = {
    id: 'test', name: 'Test', createdAt: '', updatedAt: '',
    inspirations: [{
      id: 'inspo-1', name: 'Stripe', sourceType: 'url', capturedAt: '', tags: [],
      fingerprint: 'abc', version: 1,
      analysis: {
        colors: [{ hex: '#0055FF', count: 5, samples: [] }],
        typography: [{ fontFamily: 'Inter, sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '24px', count: 10 }],
        components: [], motion: [], layout: [],
        cssVariables: { '--brand-color-primary': '#0055FF', '--spacing-sm': '8px' },
      },
    }],
    outcomes: [],
  };

  const result = generateStyleDictionary(project);
  assert.ok(result.color);
  assert.ok(result.color['color-primary']);
  assert.equal(result.color['color-primary'].value, '#0055FF');
  assert.equal(result.color['color-primary'].type, 'color');
  assert.ok(result.font);
  assert.ok(result.font.family);
  assert.ok(result.font.size);
});

test('generateStyleDictionary extracts motion tokens', () => {
  const project = {
    id: 'test', name: 'Test', createdAt: '', updatedAt: '',
    inspirations: [{
      id: 'inspo-1', name: 'Test', sourceType: 'url', capturedAt: '', tags: [],
      fingerprint: 'abc', version: 1,
      analysis: {
        colors: [], typography: [], components: [], layout: [],
        motion: [{
          selector: '.btn', transition: 'all 0.3s ease', animation: 'none', transform: 'none',
          transitions: [{ property: 'all', duration: '0.3s', timingFunction: 'ease', delay: '0s' }],
        }],
        cssVariables: {},
      },
    }],
    outcomes: [],
  };

  const result = generateStyleDictionary(project);
  assert.ok(result.motion);
});

test('generateStyleDictionary handles empty project', () => {
  const project = {
    id: 'test', name: 'Test', createdAt: '', updatedAt: '',
    inspirations: [], outcomes: [],
  };

  const result = generateStyleDictionary(project);
  assert.deepEqual(result.color, {});
  assert.deepEqual(result.font, { family: {}, size: {} });
});
