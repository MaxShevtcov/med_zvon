import test from 'node:test';
import assert from 'node:assert/strict';
import { classify } from './index.js';

test('index: classify is imported as a function', () => {
  assert.strictEqual(typeof classify, 'function');
});

test('index: classify returns stable result shape', () => {
  const r = classify('текст');
  const keys = Object.keys(r).sort();
  assert.deepStrictEqual(keys, ['confidence', 'intent', 'matched', 'scores']);
});

test('index: end-to-end CANCEL through public API', () => {
  assert.strictEqual(classify('мне нужно отменить запись на пятницу').intent, 'CANCEL');
});
