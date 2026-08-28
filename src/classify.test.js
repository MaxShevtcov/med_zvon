import test from 'node:test';
import assert from 'node:assert/strict';
import { classify } from './classify.js';
import { minConfidence } from './thresholds.js';

const DOMAIN_KEYS = ['BOOK', 'CANCEL', 'COMPLAINT', 'INFO', 'OPERATOR', 'RESCHEDULE'];
const ALL_INTENTS = ['BOOK', 'CANCEL', 'RESCHEDULE', 'INFO', 'OPERATOR', 'COMPLAINT', 'UNCLEAR'];

function isDomainShape(result) {
  assert.deepStrictEqual(Object.keys(result.scores).sort(), DOMAIN_KEYS);
  assert.deepStrictEqual(Object.keys(result.matched).sort(), DOMAIN_KEYS);
}

test('classify: guard path (null/empty/short) → UNCLEAR with score 0', () => {
  for (const input of [null, undefined, '', '   ', 'ок', 42, {}, Symbol()]) {
    const r = classify(input);
    assert.strictEqual(r.intent, 'UNCLEAR', `input ${String(input)}`);
    assert.strictEqual(r.confidence, 0);
    isDomainShape(r);
    for (const k of DOMAIN_KEYS) assert.strictEqual(r.scores[k], 0);
  }
});

test('classify: single weak signal below minConfidence → UNCLEAR', () => {
  const r = classify('запись');
  assert.strictEqual(r.intent, 'UNCLEAR');
  assert.ok(r.confidence < minConfidence);
});

test('classify: explicit domain winner → CANCEL', () => {
  const r = classify('мне нужно отменить запись на пятницу');
  assert.strictEqual(r.intent, 'CANCEL');
  assert.ok(r.confidence >= minConfidence);
});

test('classify: greeting marker does not override domain', () => {
  const r = classify('здравствуйте хочу записаться к терапевту');
  assert.strictEqual(r.intent, 'BOOK');
});

test('classify: conversational phrases → UNCLEAR (no conversational layer)', () => {
  assert.strictEqual(classify('до свидания').intent, 'UNCLEAR');
  assert.strictEqual(classify('спасибо').intent, 'UNCLEAR');
  assert.strictEqual(classify('здравствуйте').intent, 'UNCLEAR');
  assert.strictEqual(classify('спасибо до свидания').intent, 'UNCLEAR');
});

test('classify: result shape and confidence in [0,1]', () => {
  for (const input of ['мне нужно отменить запись на пятницу', 'спасибо', 'ыаыы ало алё']) {
    const r = classify(input);
    isDomainShape(r);
    assert.ok(r.confidence >= 0 && r.confidence <= 1, `confidence ${r.confidence}`);
    assert.ok(ALL_INTENTS.includes(r.intent), `intent ${r.intent}`);
  }
});

test('classify: determinism', () => {
  for (const input of ['мне нужно отменить запись на пятницу', 'спасибо до свидания']) {
    assert.deepStrictEqual(classify(input), classify(input));
  }
});

test('classify: never throws on edge inputs', () => {
  const longStr = 'а'.repeat(10000);
  assert.doesNotThrow(() => classify(longStr));
  assert.doesNotThrow(() => classify({ a: 1 }));
  assert.doesNotThrow(() => classify(Symbol('x')));
});
