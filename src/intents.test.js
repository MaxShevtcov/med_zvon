import test from 'node:test';
import assert from 'node:assert/strict';
import { INTENTS } from './intents.js';
import { strongBigramWeight, mediumUnigramWeight, weakUnigramWeight } from './thresholds.js';

test('intents: has all 7 keys', () => {
  const keys = Object.keys(INTENTS);
  assert.deepStrictEqual(keys.sort(), ['BOOK', 'CANCEL', 'COMPLAINT', 'INFO', 'OPERATOR', 'RESCHEDULE', 'UNCLEAR']);
});

test('intents: each scorable intent has unigrams, bigrams, referenceScore', () => {
  for (const name of ['BOOK', 'CANCEL', 'RESCHEDULE', 'INFO', 'OPERATOR', 'COMPLAINT']) {
    assert.ok(Array.isArray(INTENTS[name].unigrams), `${name} missing unigrams`);
    assert.ok(Array.isArray(INTENTS[name].bigrams), `${name} missing bigrams`);
    assert.strictEqual(typeof INTENTS[name].referenceScore, 'number', `${name} missing referenceScore`);
    assert.ok(INTENTS[name].referenceScore > 0, `${name} referenceScore must be > 0`);
  }
});

test('intents: UNCLEAR has empty unigrams and bigrams', () => {
  assert.deepStrictEqual(INTENTS.UNCLEAR.unigrams, []);
  assert.deepStrictEqual(INTENTS.UNCLEAR.bigrams, []);
});

test('intents: all tokens are objects with token and weight', () => {
  for (const [name, intent] of Object.entries(INTENTS)) {
    if (name === 'UNCLEAR') continue;
    for (const entry of intent.unigrams) {
      assert.strictEqual(typeof entry.token, 'string', `${name} unigram token must be string`);
      assert.strictEqual(typeof entry.weight, 'number', `${name} unigram weight must be number`);
    }
    for (const entry of intent.bigrams) {
      assert.strictEqual(typeof entry.token, 'string', `${name} bigram token must be string`);
      assert.strictEqual(typeof entry.weight, 'number', `${name} bigram weight must be number`);
    }
  }
});

test('intents: запись is weak (<= weakUnigramWeight) everywhere it appears', () => {
  for (const [name, intent] of Object.entries(INTENTS)) {
    if (name === 'UNCLEAR') continue;
    for (const entry of intent.unigrams) {
      if (entry.token === 'запись') {
        assert.ok(entry.weight <= weakUnigramWeight,
          `${name}: запись weight ${entry.weight} > weakUnigramWeight ${weakUnigramWeight}`);
      }
    }
  }
});

test('intents: no token is strong (>= mediumUnigramWeight) in more than one intent', () => {
  const tokenIntents = new Map();
  for (const [name, intent] of Object.entries(INTENTS)) {
    if (name === 'UNCLEAR') continue;
    for (const entry of intent.unigrams) {
      if (entry.weight >= mediumUnigramWeight) {
        if (!tokenIntents.has(entry.token)) tokenIntents.set(entry.token, []);
        tokenIntents.get(entry.token).push(name);
      }
    }
    for (const entry of intent.bigrams) {
      if (entry.weight >= mediumUnigramWeight) {
        if (!tokenIntents.has(entry.token)) tokenIntents.set(entry.token, []);
        tokenIntents.get(entry.token).push(name);
      }
    }
  }
  for (const [token, intents] of tokenIntents) {
    assert.ok(intents.length <= 1,
      `Token "${token}" is strong in multiple intents: ${intents.join(', ')}`);
  }
});

test('intents: no strong bigram is duplicated across intents', () => {
  const bigramIntents = new Map();
  for (const [name, intent] of Object.entries(INTENTS)) {
    if (name === 'UNCLEAR') continue;
    for (const entry of intent.bigrams) {
      if (entry.weight >= mediumUnigramWeight) {
        if (!bigramIntents.has(entry.token)) bigramIntents.set(entry.token, []);
        bigramIntents.get(entry.token).push(name);
      }
    }
  }
  for (const [token, intents] of bigramIntents) {
    assert.ok(intents.length <= 1,
      `Bigram "${token}" is strong in multiple intents: ${intents.join(', ')}`);
  }
});

test('intents: all tokens are lowercase and punctuation-free', () => {
  for (const [name, intent] of Object.entries(INTENTS)) {
    if (name === 'UNCLEAR') continue;
    for (const entry of [...intent.unigrams, ...intent.bigrams]) {
      assert.strictEqual(entry.token, entry.token.toLowerCase(),
        `${name}: "${entry.token}" is not lowercase`);
      assert.ok(!/[^\p{L}\p{N}\s]/u.test(entry.token),
        `${name}: "${entry.token}" contains punctuation`);
    }
  }
});
