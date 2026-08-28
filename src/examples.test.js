import test from 'node:test';
import assert from 'node:assert/strict';
import { classify } from './index.js';

const CASES = [
  { input: 'здравствуйте хочу записаться к терапевту на завтра', expected: 'BOOK' },
  { input: 'мне нужно отменить запись на пятницу', expected: 'CANCEL' },
  { input: 'скажите сколько стоит приём кардиолога', expected: 'INFO' },
  { input: 'это безобразие я час жду на линии хочу пожаловаться', expected: 'COMPLAINT' },
  { input: 'хочу за писаться к врачу на вторник', expected: 'BOOK' },
  { input: 'мне ну это самое отменить наверное запись', expected: 'CANCEL' },
  { input: 'скока стоит прием у лора', expected: 'INFO' },
  { input: 'хочу с человеком поговорить а не с роботом', expected: 'OPERATOR' },
  { input: 'принести запись на среду вместо четверга', expected: 'RESCHEDULE' },
  { input: 'ыаыы ало алё', expected: 'UNCLEAR' },
];

for (const [i, c] of CASES.entries()) {
  test(`case #${i + 1}: "${c.input}" → ${c.expected}`, () => {
    assert.strictEqual(classify(c.input).intent, c.expected);
  });
}

test('extended: ambiguous token without context → UNCLEAR (P1)', () => {
  assert.strictEqual(classify('принести справку в клинику').intent, 'UNCLEAR');
});

test('extended: greeting marker does not override domain', () => {
  assert.strictEqual(classify('здравствуйте хочу записаться').intent, 'BOOK');
});

test('extended: pure conversational phrases are UNCLEAR (no conversational layer)', () => {
  assert.strictEqual(classify('здравствуйте').intent, 'UNCLEAR');
  assert.strictEqual(classify('до свидания').intent, 'UNCLEAR');
  assert.strictEqual(classify('спасибо большое').intent, 'UNCLEAR');
  assert.strictEqual(classify('спасибо до свидания').intent, 'UNCLEAR');
});

test('extended: imperative booking synonyms → BOOK', () => {
  assert.strictEqual(classify('запиши меня на прием').intent, 'BOOK');
  assert.strictEqual(classify('запишите меня на прием').intent, 'BOOK');
});

test('extended: INFO synonyms (price/hours) → INFO', () => {
  assert.strictEqual(classify('часы работы поликлиники').intent, 'INFO');
  assert.strictEqual(classify('какая стоимость приема').intent, 'INFO');
});

test('extended: COMPLAINT/OPERATOR synonyms', () => {
  assert.strictEqual(classify('у меня претензия к вам').intent, 'COMPLAINT');
  assert.strictEqual(classify('хочу с человеком поговорить').intent, 'OPERATOR');
});

test('extended: stemmed inflected forms route to correct intent', () => {
  assert.strictEqual(classify('запишете меня на прием').intent, 'BOOK');
  assert.strictEqual(classify('перенесите запись на завтра').intent, 'RESCHEDULE');
});


test('extended: no false UNCLEAR on cases 1-9', () => {
  const nonUnclear = CASES.filter((c) => c.expected !== 'UNCLEAR');
  for (const c of nonUnclear) {
    assert.notStrictEqual(classify(c.input).intent, 'UNCLEAR', c.input);
  }
});

test('extended: no false intent on case 10', () => {
  assert.strictEqual(classify('ыаыы ало алё').intent, 'UNCLEAR');
});

test('extended: determinism — double run gives identical results', () => {
  for (const c of CASES) {
    const r1 = classify(c.input);
    const r2 = classify(c.input);
    assert.deepStrictEqual(r1, r2, c.input);
  }
});

