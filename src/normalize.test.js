import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from './normalize.js';

test('normalize: null returns null', () => {
  assert.strictEqual(normalize(null), null);
});

test('normalize: undefined returns null', () => {
  assert.strictEqual(normalize(undefined), null);
});

test('normalize: empty string returns null', () => {
  assert.strictEqual(normalize(''), null);
});

test('normalize: whitespace-only returns null', () => {
  assert.strictEqual(normalize('   '), null);
});

test('normalize: too short after trim returns null', () => {
  assert.strictEqual(normalize('ок'), null);
});

test('normalize: non-string returns null', () => {
  assert.strictEqual(normalize(42), null);
  assert.strictEqual(normalize({}), null);
  assert.strictEqual(normalize([]), null);
});

test('normalize: lowercase', () => {
  assert.strictEqual(normalize('Приём'), 'приём');
});

test('normalize: removes punctuation', () => {
  assert.strictEqual(normalize('приём,'), 'приём');
  assert.strictEqual(normalize('сколько стоит?!!!'), 'сколько стоит');
});

test('normalize: collapses whitespace', () => {
  assert.strictEqual(normalize('а   б\tв'), 'а б в');
});

test('normalize: trims edges', () => {
  assert.strictEqual(normalize('  привет  '), 'привет');
});

test('normalize: truncates to maxInputLen', () => {
  const input = 'а '.repeat(300);
  const result = normalize(input);
  assert.ok(result.length <= 500);
});

test('normalize: idempotent on clean input', () => {
  const input = 'Привет,   мир!';
  assert.strictEqual(normalize(normalize(input)), normalize(input));
});

test('normalize: does not mutate input', () => {
  const input = 'Привет, мир!';
  normalize(input);
  assert.strictEqual(input, 'Привет, мир!');
});

test('normalize: only punctuation returns null', () => {
  assert.strictEqual(normalize('?!...'), null);
});
