import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenize } from './tokenize.js';

test('tokenize: unigrams from space-separated string', () => {
  const result = tokenize('хочу за писаться');
  assert.deepStrictEqual(result.unigrams, ['хочу', 'за', 'писаться']);
});

test('tokenize: bigrams are adjacent pairs', () => {
  const result = tokenize('хочу за писаться');
  assert.deepStrictEqual(result.bigrams, ['хочу за', 'за писаться']);
});

test('tokenize: empty string returns empty arrays', () => {
  assert.deepStrictEqual(tokenize(''), { unigrams: [], bigrams: [] });
});

test('tokenize: one token returns one unigram, no bigrams', () => {
  const result = tokenize('привет');
  assert.deepStrictEqual(result, { unigrams: ['привет'], bigrams: [] });
});

test('tokenize: two tokens return one bigram', () => {
  const result = tokenize('а б');
  assert.deepStrictEqual(result, { unigrams: ['а', 'б'], bigrams: ['а б'] });
});

test('tokenize: does not mutate input', () => {
  const input = 'хочу записаться';
  tokenize(input);
  assert.strictEqual(input, 'хочу записаться');
});

test('tokenize: determinism', () => {
  const input = 'отменить запись';
  const r1 = tokenize(input);
  const r2 = tokenize(input);
  assert.deepStrictEqual(r1, r2);
});
