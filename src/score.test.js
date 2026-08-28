import test from 'node:test';
import assert from 'node:assert/strict';
import { score } from './score.js';
import { INTENTS } from './intents.js';
import { strongBigramWeight, mediumUnigramWeight, weakUnigramWeight } from './thresholds.js';

const DOMAIN_KEYS = ['BOOK', 'CANCEL', 'COMPLAINT', 'INFO', 'OPERATOR', 'RESCHEDULE'];

test('score: keys are exactly 6 domain intents', () => {
  const result = score({ unigrams: [], bigrams: [] }, INTENTS);
  const scoreKeys = Object.keys(result.scores).sort();
  const matchedKeys = Object.keys(result.matched).sort();
  assert.deepStrictEqual(scoreKeys, DOMAIN_KEYS);
  assert.deepStrictEqual(matchedKeys, DOMAIN_KEYS);
});

test('score: empty tokens → all zeros', () => {
  const result = score({ unigrams: [], bigrams: [] }, INTENTS);
  for (const k of DOMAIN_KEYS) {
    assert.strictEqual(result.scores[k], 0);
    assert.deepStrictEqual(result.matched[k], []);
  }
});

test('score: no matches → all zeros', () => {
  const result = score({ unigrams: ['абракадабра'], bigrams: [] }, INTENTS);
  for (const k of DOMAIN_KEYS) {
    assert.strictEqual(result.scores[k], 0);
  }
});

test('score: exact bigram match scores more than unigram alone', () => {
  const fromBigram = score({ unigrams: ['отменить', 'запись'], bigrams: ['отменить запись'] }, INTENTS);
  const fromUnigrams = score({ unigrams: ['отменить', 'запись'], bigrams: [] }, INTENTS);
  assert.ok(fromBigram.scores.CANCEL > fromUnigrams.scores.CANCEL,
    `bigram ${fromBigram.scores.CANCEL} should exceed unigrams ${fromUnigrams.scores.CANCEL}`);
});

test('score: exact match — за писаться matches bigram, not unigram записаться', () => {
  const result = score({ unigrams: ['хочу', 'за', 'писаться'], bigrams: ['хочу за', 'за писаться'] }, INTENTS);
  assert.strictEqual(result.scores.BOOK, strongBigramWeight,
    'BOOK should get only the bigram weight, not unigram записаться');
});

test('score: запись alone gives weak score to BOOK and CANCEL', () => {
  const result = score({ unigrams: ['запись'], bigrams: [] }, INTENTS);
  assert.strictEqual(result.scores.BOOK, weakUnigramWeight);
  assert.strictEqual(result.scores.CANCEL, weakUnigramWeight);
});

test('score: отменить запись gives CANCEL strong+medium', () => {
  const result = score({ unigrams: ['отменить', 'запись'], bigrams: ['отменить запись'] }, INTENTS);
  assert.strictEqual(result.scores.CANCEL, strongBigramWeight + mediumUnigramWeight + weakUnigramWeight);
});

test('score: matched tracks which entries fired', () => {
  const result = score({ unigrams: ['отменить', 'запись'], bigrams: ['отменить запись'] }, INTENTS);
  assert.ok(result.matched.CANCEL.includes('отменить запись'));
  assert.ok(result.matched.CANCEL.includes('отменить'));
  assert.ok(result.matched.CANCEL.includes('запись'));
});

test('score: determinism', () => {
  const tokens = { unigrams: ['стоит', 'сколько'], bigrams: ['сколько стоит'] };
  const r1 = score(tokens, INTENTS);
  const r2 = score(tokens, INTENTS);
  assert.deepStrictEqual(r1, r2);
});
