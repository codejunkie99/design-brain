import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBatchFile } from '../dist/batch.js';

test('parseBatchFile parses tab-separated lines', () => {
  const input = 'https://stripe.com\tStripe\tpayments,fintech\nhttps://linear.app\tLinear\n';
  const entries = parseBatchFile(input);
  assert.equal(entries.length, 2);
  assert.equal(entries[0].url, 'https://stripe.com');
  assert.equal(entries[0].name, 'Stripe');
  assert.deepEqual(entries[0].tags, ['payments', 'fintech']);
  assert.equal(entries[1].url, 'https://linear.app');
  assert.equal(entries[1].name, 'Linear');
  assert.deepEqual(entries[1].tags, []);
});

test('parseBatchFile skips empty lines and comments', () => {
  const input = '# Header comment\nhttps://stripe.com\tStripe\n\n# Another comment\nhttps://linear.app\n';
  const entries = parseBatchFile(input);
  assert.equal(entries.length, 2);
});

test('parseBatchFile handles URL-only lines', () => {
  const input = 'https://stripe.com\nhttps://linear.app\n';
  const entries = parseBatchFile(input);
  assert.equal(entries.length, 2);
  assert.equal(entries[0].name, undefined);
  assert.deepEqual(entries[0].tags, []);
});
