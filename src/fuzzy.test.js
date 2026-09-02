import test from 'node:test';
import assert from 'node:assert/strict';
import { fuzzy, levenshtein } from './fuzzy.js';
import { INTENTS } from './intents.js';
import { THRESHOLDS, fuzzyMinPartial, minTokenLenForFuzzy } from './thresholds.js';

const DOMAIN_KEYS = ['BOOK', 'CANCEL', 'COMPLAINT', 'INFO', 'OPERATOR', 'RESCHEDULE'];

function zeros() {
  const s = {};
  for (const k of DOMAIN_KEYS) s[k] = 0;
  return s;
}

test('fuzzy: keys are exactly 6 domain intents', () => {
  const result = fuzzy({ unigrams: [], bigrams: [] }, INTENTS, THRESHOLDS);
  assert.deepStrictEqual(Object.keys(result.scores).sort(), DOMAIN_KEYS);
  assert.deepStrictEqual(Object.keys(result.matched).sort(), DOMAIN_KEYS);
});

test('levenshtein: known distances', () => {
  assert.strictEqual(levenshtein('принести', 'перенести'), 2);
  assert.strictEqual(levenshtein('кот', 'собака'), 5);
  assert.strictEqual(levenshtein('скока', 'сколько'), 3);
  assert.strictEqual(levenshtein('кот', 'кот'), 0);
});

test('fuzzy: принести ≈ перенести boosts RESCHEDULE above fuzzyMinPartial', () => {
  const result = fuzzy({ unigrams: ['принести'], bigrams: [] }, INTENTS, THRESHOLDS);
  assert.ok(result.scores.RESCHEDULE > 0);
  assert.ok(result.scores.RESCHEDULE >= fuzzyMinPartial);
  assert.ok(result.matched.RESCHEDULE.some((s) => s.includes('принести') && s.includes('перенести')));
});

test('fuzzy: short tokens (< minTokenLenForFuzzy) are skipped', () => {
  const result = fuzzy({ unigrams: ['кот'], bigrams: [] }, INTENTS, THRESHOLDS);
  const total = Object.values(result.scores).reduce((a, b) => a + b, 0);
  assert.strictEqual(total, 0);
});

test('fuzzy: exact-match tokens are not re-scored (distance 0 skipped)', () => {
  const result = fuzzy({ unigrams: ['перенести'], bigrams: [] }, INTENTS, THRESHOLDS);
  const selfMatches = result.matched.RESCHEDULE.filter((s) => s.includes('перенести≈перенести'));
  assert.strictEqual(selfMatches.length, 0, 'exact self-match must be skipped');
  const fullWeightSelf = result.matched.RESCHEDULE.filter((s) => s.includes('(+2.00)'));
  assert.strictEqual(fullWeightSelf.length, 0, 'exact token must not add its full weight');
});

test('fuzzy: token with no близкий neighbor → delta 0', () => {
  const result = fuzzy({ unigrams: ['ыаыы'], bigrams: [] }, INTENTS, THRESHOLDS);
  const total = Object.values(result.scores).reduce((a, b) => a + b, 0);
  assert.strictEqual(total, 0);
});

test('fuzzy: output is partial delta, not full score', () => {
  const result = fuzzy({ unigrams: ['принести'], bigrams: [] }, INTENTS, THRESHOLDS);
  assert.ok(result.scores.RESCHEDULE > 0);
  assert.ok(result.scores.RESCHEDULE <= fuzzyMinPartial * 10,
    'delta should be bounded, not a full score');
});

test('fuzzy: determinism', () => {
  const tokens = { unigrams: ['принести'], bigrams: [] };
  const r1 = fuzzy(tokens, INTENTS, THRESHOLDS);
  const r2 = fuzzy(tokens, INTENTS, THRESHOLDS);
  assert.deepStrictEqual(r1, r2);
});

test('fuzzy: repeated input token contributes once', () => {
  const once = fuzzy({ unigrams: ['операторр'], bigrams: [] }, INTENTS, THRESHOLDS);
  const repeated = fuzzy({ unigrams: ['операторр', 'операторр'], bigrams: [] }, INTENTS, THRESHOLDS);
  assert.deepStrictEqual(repeated, once);
});

test('fuzzy: keeps only the best candidate per token and intent', () => {
  const result = fuzzy({ unigrams: ['отменять'], bigrams: [] }, INTENTS, THRESHOLDS);
  assert.strictEqual(result.matched.CANCEL.length, 1);
});

test('fuzzy: skips tokens already matched exactly', () => {
  const result = fuzzy(
    { unigrams: ['запись'], bigrams: [] },
    INTENTS,
    THRESHOLDS,
    { excludedTokens: new Set(['запись']) },
  );
  const total = Object.values(result.scores).reduce((sum, score) => sum + score, 0);
  assert.strictEqual(total, 0);
});
