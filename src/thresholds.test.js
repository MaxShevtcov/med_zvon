import test from 'node:test';
import assert from 'node:assert/strict';
import {
  guardMinLength,
  maxInputLen,
  minConfidence,
  ambiguityGap,
  fallbackThreshold,
  minTokenLenForFuzzy,
  strongBigramWeight,
  mediumUnigramWeight,
  weakUnigramWeight,
  fuzzyMinPartial,
  THRESHOLDS,
} from './thresholds.js';

test('thresholds: all numeric constants are exported as numbers', () => {
  const numerics = [
    guardMinLength, maxInputLen, minConfidence, ambiguityGap,
    fallbackThreshold, minTokenLenForFuzzy,
    strongBigramWeight, mediumUnigramWeight,
    weakUnigramWeight, fuzzyMinPartial,
  ];
  for (const v of numerics) {
    assert.strictEqual(typeof v, 'number');
  }
});

test('thresholds: ranges are valid', () => {
  assert.ok(guardMinLength > 0 && guardMinLength <= maxInputLen);
  assert.ok(minConfidence > 0 && minConfidence <= 1);
  assert.ok(ambiguityGap >= 0 && ambiguityGap <= 1);
  assert.ok(fallbackThreshold > 0);
  assert.ok(minTokenLenForFuzzy >= 1);
  assert.ok(fuzzyMinPartial > 0);
});

test('thresholds: weight ordering strong > medium > weak', () => {
  assert.ok(strongBigramWeight > mediumUnigramWeight);
  assert.ok(mediumUnigramWeight > weakUnigramWeight);
});

test('thresholds: THRESHOLDS object is frozen', () => {
  assert.ok(Object.isFrozen(THRESHOLDS));
});

test('thresholds: THRESHOLDS contains all keys', () => {
  assert.deepStrictEqual(Object.keys(THRESHOLDS).sort(), [
    'ambiguityGap',
    'fallbackThreshold',
    'fuzzyMinPartial',
    'guardMinLength',
    'maxInputLen',
    'mediumUnigramWeight',
    'minConfidence',
    'minTokenLenForFuzzy',
    'strongBigramWeight',
    'weakUnigramWeight',
  ]);
});
