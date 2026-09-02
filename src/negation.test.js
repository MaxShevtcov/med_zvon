import test from 'node:test';
import assert from 'node:assert/strict';
import { negatedTokenIndexes } from './negation.js';

test('negation: suppresses a negated action through the end of a clause', () => {
  assert.deepStrictEqual(
    [...negatedTokenIndexes(['не', 'хочу', 'отменять', 'запись'])],
    [1, 2, 3],
  );
});

test('negation: stops before contrast with а', () => {
  assert.deepStrictEqual(
    [...negatedTokenIndexes(['не', 'отменить', 'а', 'перенести', 'запись'])],
    [1],
  );
});

test('negation: keeps operator phrase не с роботом affirmative', () => {
  assert.deepStrictEqual(
    [...negatedTokenIndexes(['не', 'с', 'роботом'])],
    [],
  );
});
