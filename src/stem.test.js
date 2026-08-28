import test from 'node:test';
import assert from 'node:assert/strict';
import { stemToken, buildStemIndex, stemMatch } from './stem.js';
import { INTENTS } from './intents.js';
import { THRESHOLDS, minTokenLenForStem, mediumUnigramWeight } from './thresholds.js';

const DOMAIN_KEYS = ['BOOK', 'CANCEL', 'COMPLAINT', 'INFO', 'OPERATOR', 'RESCHEDULE'];

test('stem: inflected forms of one lemma converge', () => {
  assert.strictEqual(stemToken('запишусь'), stemToken('записаться'));
  assert.strictEqual(stemToken('запишетесь'), stemToken('записаться'));
  assert.strictEqual(stemToken('перенесите'), stemToken('перенести'));
  assert.strictEqual(stemToken('перенесу'), stemToken('перенести'));
  assert.strictEqual(stemToken('стоят'), stemToken('стоит'));
  assert.strictEqual(stemToken('роботом'), stemToken('робот'));
  assert.strictEqual(stemToken('человеком'), stemToken('человек'));
  assert.strictEqual(stemToken('жалуюсь'), stemToken('жалоба'));
});

test('stem: suppletive alternations converge to booked stems', () => {
  assert.strictEqual(stemToken('запишетесь'), 'запис');
  assert.strictEqual(stemToken('записаться'), 'запис');
});

test('stem: short tokens are not destroyed', () => {
  assert.strictEqual(stemToken('цена'), 'цена');
  assert.strictEqual(stemToken('зап'), 'зап');
  assert.strictEqual(stemToken('часы'), 'часы');
});

test('stem: trivial and short words returned unchanged', () => {
  assert.strictEqual(stemToken('а'), 'а');
  assert.strictEqual(stemToken('вас'), 'вас');
  assert.strictEqual(stemToken('123'), '123');
  assert.strictEqual(stemToken('на'), 'на');
});

test('stem: weak token запись is protected (no BOOK collision)', () => {
  assert.strictEqual(stemToken('запись'), 'запись');
  assert.notStrictEqual(stemToken('запись'), stemToken('записаться'));
});

test('stem: разные леммы не сводятся (стоимость ≠ стоит)', () => {
  assert.notStrictEqual(stemToken('стоимость'), stemToken('стоит'));
});

test('stem: ё normalizes to е', () => {
  assert.strictEqual(stemToken('приём'), stemToken('прием'));
});

test('stem: purity — does not mutate input', () => {
  const w = 'перенести';
  stemToken(w);
  assert.strictEqual(w, 'перенести');
});

test('stem: determinism', () => {
  const out1 = stemToken('запишетесь');
  const out2 = stemToken('запишетесь');
  assert.strictEqual(out1, out2);
});

test('stem: non-string/empty handled', () => {
  assert.strictEqual(stemToken(''), '');
  assert.strictEqual(stemToken(42), 42);
});

test('stem: buildStemIndex does not mutate INTENTS', () => {
  const snapshot = JSON.stringify(INTENTS);
  buildStemIndex(INTENTS);
  assert.strictEqual(JSON.stringify(INTENTS), snapshot);
});

test('stem: запишетесь stem present in BOOK index with original token', () => {
  const idx = buildStemIndex(INTENTS);
  const entries = idx.get('запис');
  assert.ok(entries && entries.length > 0);
  assert.ok(entries.some((e) => e.intent === 'BOOK' && e.token === 'записаться'));
});

test('stem: stemMatch on запишете adds full medium weight to BOOK', () => {
  const idx = buildStemIndex(INTENTS);
  const r = stemMatch({ unigrams: ['запишете', 'меня'], bigrams: [] }, INTENTS, idx, THRESHOLDS);
  assert.strictEqual(r.scores.BOOK, mediumUnigramWeight);
  assert.ok(r.matched.BOOK.includes('записаться'));
});

test('stem: exactly matched token is not re-scored (no double count)', () => {
  const idx = buildStemIndex(INTENTS);
  const r = stemMatch({ unigrams: ['записаться'], bigrams: [] }, INTENTS, idx, THRESHOLDS);
  assert.strictEqual(r.scores.BOOK, 0);
  assert.strictEqual(r.matched.BOOK.length, 0);
});

test('stem: weak token запись does not become a BOOK stem match', () => {
  const idx = buildStemIndex(INTENTS);
  const r = stemMatch({ unigrams: ['запись'], bigrams: [] }, INTENTS, idx, THRESHOLDS);
  assert.strictEqual(r.scores.BOOK, 0);
});

test('stem: bigrams are not processed by stemMatch', () => {
  const idx = buildStemIndex(INTENTS);
  const r = stemMatch({ unigrams: [], bigrams: ['за писаться'] }, INTENTS, idx, THRESHOLDS);
  const total = Object.values(r.scores).reduce((a, b) => a + b, 0);
  assert.strictEqual(total, 0);
});

test('stem: keys are exactly 6 domain intents', () => {
  const idx = buildStemIndex(INTENTS);
  const r = stemMatch({ unigrams: ['запишете'], bigrams: [] }, INTENTS, idx, THRESHOLDS);
  assert.deepStrictEqual(Object.keys(r.scores).sort(), DOMAIN_KEYS);
  assert.deepStrictEqual(Object.keys(r.matched).sort(), DOMAIN_KEYS);
});

test('stem: stemMatch determinism', () => {
  const idx = buildStemIndex(INTENTS);
  const a = stemMatch({ unigrams: ['перенесите'], bigrams: [] }, INTENTS, idx, THRESHOLDS);
  const b = stemMatch({ unigrams: ['перенесите'], bigrams: [] }, INTENTS, idx, THRESHOLDS);
  assert.deepStrictEqual(a, b);
});
