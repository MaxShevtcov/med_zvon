---
name: tdd-workflow
description: Testing conventions for med-zvon — node:test + node:assert, ESM, TDD-first
---

## TDD-first (по умолчанию)

**Правило:** если пользователь не сказал явно иначе, разработка ведётся через TDD.

Цикл:
1. **Red** — написать тест под ожидаемое поведение (тест падает)
2. **Green** — написать минимальную реализацию, чтобы тест прошёл
3. **Refactor** — улучшить код, тесты остаются зелёными

Исключения (когда TDD не применяется):
- Пользователь явно сказал "без тестов" или "prototype/sketch"
- Hotfix (срочный багфикс)

## Фреймворк

Встроенный **node:test** (единственный — без Jest, Vitest, ts-node).

```bash
node --test                 # все *.test.js в проекте
node --test src/foo.test.js # конкретный файл
node --test --watch         # watch mode
```

- `import test from 'node:test'` + `import assert from 'node:assert/strict'`
- Файлы `*.test.js` рядом с исходником
- Для сравнения объектов — `assert.deepStrictEqual`

## Структура теста

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { classify } from './intent.js';

test('BOOK: чистый текст', () => {
  assert.equal(classify('здравствуйте хочу записаться к терапевту'), 'BOOK');
});
```

## Табличные тесты

Для набора примеров (как таблица из ТЗ) — табличный драйвер, один кейс = один тест:

```js
const cases = [
  ['здравствуйте хочу записаться к терапевту на завтра', 'BOOK'],
  ['мне нужно отменить запись на пятницу', 'CANCEL'],
  ['хочу за писаться к врачу на вторник', 'BOOK'],
  ['ыаыы ало алё', 'UNCLEAR'],
];

for (const [input, expected] of cases) {
  test(`${expected} ← "${input}"`, () => {
    assert.equal(classify(input), expected);
  });
}
```

## Mocking

- Внешних вызовов нет (без LLM/API); при необходимости — моки `node:test` (`t.mock.method`)
- Тесты детерминированные: без времени/сети в ядре классификации
