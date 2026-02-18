import test from 'node:test';
import assert from 'node:assert/strict';
import { nameColor, nameTypographySize, nameMotionDuration, nameTokens } from '../dist/tokenNaming.js';

test('nameColor maps red to nearest CSS color name', () => {
  const name = nameColor('#FF0000');
  assert.equal(name, 'red');
});

test('nameColor maps a blue-purple to a CSS color name', () => {
  const name = nameColor('#533AFD');
  assert.ok(name.length > 0);
  assert.ok(!name.startsWith('#'));
});

test('nameColor handles shorthand hex', () => {
  const name = nameColor('#F00');
  assert.equal(name, 'red');
});

test('nameTypographySize maps pixel values to semantic names', () => {
  assert.equal(nameTypographySize('10px'), 'xs');
  assert.equal(nameTypographySize('13px'), 'sm');
  assert.equal(nameTypographySize('16px'), 'md');
  assert.equal(nameTypographySize('22px'), 'lg');
  assert.equal(nameTypographySize('32px'), 'xl');
});

test('nameMotionDuration maps durations to bucket names', () => {
  assert.equal(nameMotionDuration('50ms'), 'instant');
  assert.equal(nameMotionDuration('150ms'), 'quick');
  assert.equal(nameMotionDuration('300ms'), 'normal');
  assert.equal(nameMotionDuration('500ms'), 'slow');
  assert.equal(nameMotionDuration('0.3s'), 'normal');
});

test('nameTokens returns a map from a project', () => {
  const project = {
    id: 'test', name: 'Test', createdAt: '', updatedAt: '',
    inspirations: [{
      id: 'i1', name: 'I1', sourceType: 'url', capturedAt: '', tags: [],
      fingerprint: 'a', version: 1,
      analysis: {
        colors: [{ hex: '#FF0000', count: 5, samples: [] }],
        typography: [{ fontFamily: 'Inter', fontSize: '16px', fontWeight: '400', lineHeight: '24px', count: 3 }],
        components: [], layout: [], cssVariables: {},
        motion: [{ selector: '.btn', transition: 'all 0.3s ease', animation: '', transform: '',
          transitions: [{ property: 'all', duration: '0.3s', timingFunction: 'ease', delay: '0s' }] }],
      },
    }],
    outcomes: [],
  };

  const map = nameTokens(project);
  assert.ok(map.size > 0);
  assert.ok(map.has('#FF0000'));
  assert.ok(map.has('16px'));
  assert.ok(map.has('0.3s'));
});
