# Архитектура — МедЗвон

**Раскрывает:** `roadmap.md` §2
**Цель:** точные обязанности модулей, формы данных, контракт публичного API и граф зависимостей модулей.

---

## Обязанности модулей (по одной строке)

| Модуль | Обязанность |
|--------|-------------|
| `thresholds.js` | Все настраиваемые константы — ни один другой файл не держит magic numbers |
| `normalize.js` | Guard против `null`/пустого/короткого входа, затем lowercase, очистка пунктуации, схлопывание пробелов, ограничение длины |
| `tokenize.js` | Преобразование нормализованной строки в массивы униграмм и биграмм |
| `conversational.js` | Детекция приветствия/прощания/благодарности: точное совпадение маркеров по униграммам и биграммам, приоритет `FAREWELL` > `THANKS` > `GREETING` |
| `intents.js` | Определения 6 доменных намерений: взвешенные записи `unigrams` + `bigrams` (включая STT-разрывные сигналы) |
| `score.js` | Точный скоринг доменных намерений: сумма весов совпавших записей словаря |
| `fuzzy.js` | Левенштейн-фолбэк: добавить частичный вес для близко совпавших токенов (len ≥ `minTokenLenForFuzzy`), только против доменного словаря |
| `classify.js` | Оркестратор + двухуровневый резолвер: запустить пайплайн, применить пороги (доменное > конверсационное > UNCLEAR), собрать объект-результат |
| `index.js` | Публичный API: `export { classify } from './classify.js'` |

---

## Контракт публичного API

```js
import { classify } from './src/index.js';

const result = classify('хочу за писаться к врачу на вторник');
```

```js
// форма результата
{
  intent: 'BOOK',                 // одна из 10 строк намерений (6 доменных + 3 конверсационных + UNCLEAR)
  confidence: 0.72,               // число в [0, 1]
  scores: {                       // сырые взвешенные скоры по 6 доменным намерениям (у UNCLEAR и конверсационных скора нет)
    BOOK: 6.0,
    CANCEL: 0.0,
    RESCHEDULE: 0.0,
    INFO: 0.0,
    OPERATOR: 0.0,
    COMPLAINT: 0.0
  },
  matched: {                      // сработавшие строки записей словаря по намерениям (для отладки + диалогового движка)
    BOOK: ['за писаться', 'записаться к'],
    CANCEL: [],
    RESCHEDULE: [],
    INFO: [],
    OPERATOR: [],
    COMPLAINT: []
  }
}
```

**Результат `UNCLEAR`** — `intent: 'UNCLEAR'`, `confidence` = нормализованная уверенность лучшего отвергнутого кандидата, `scores`/`matched` заполнены тем, что всё-таки сработало (чтобы диалоговый движок видел, *почему* неясно, и решил: переспросить / эскалировать / подсказать).

**Инварианты:**
- `classify` — чистая функция: одинаковый вход → одинаковый вывод, без побочных эффектов, без I/O, без `Date.now`/`Math.random`.
- `classify` никогда не бросает исключение на пользовательском входе: `null`/`undefined`/`''`/не-строка → `UNCLEAR`.
- `intent` всегда одна из 10 фиксированных строк.
- Ключи `scores` — ровно 6 доменных намерений (никогда `UNCLEAR` и никогда конверсационные).
- `confidence ∈ [0, 1]`.

---

## Формы данных (внутренние контракты между модулями)

### `normalize(text: string | null | undefined) → string | null`
- Возвращает `null` (или guard-сентинел), когда вход не проходит guard (`null`/`undefined`/пусто/только пробелы/`length < guardMinLength` после trim).
- Иначе возвращает очищенную строку: в нижнем регистре, без пунктуации, внутренние пробелы схлопнуты в одиночные, обрезанную, обрезанную до `maxInputLen`.
- Чистая; не мутирует вход.

### `tokenize(normalized: string) → { unigrams: string[], bigrams: string[] }`
- `unigrams`: токены по порядку (например, `['хочу', 'за', 'писаться', 'к', 'врачу', 'на', 'вторник']`).
- `bigrams`: соседние пары токенов, соединённые одиночным пробелом (например, `['хочу за', 'за писаться', 'писаться к', 'к врачу', 'врачу на', 'на вторник']`).
- Пустая строка → `{ unigrams: [], bigrams: [] }`; один токен → одна униграмма, без биграмм.
- Чистая; детерминированная.

### Форма экспорта `conversational.js`
```js
export const CONVERSATION = {
  GREETING: { unigrams: ['здравствуйте', 'здрасте', 'добрый день', 'доброе утро', 'добрый вечер', 'привет'], bigrams: [] },
  FAREWELL: { unigrams: ['до свидания', 'всего доброго', 'всего хорошего', 'до встречи', 'пока'], bigrams: [] },
  THANKS:   { unigrams: ['спасибо', 'благодарю', 'благодарность'], bigrams: ['спасибо большое', 'благодарю вас'] }
};
export const CONVERSATIONAL_PRECEDENCE = ['FAREWELL', 'THANKS', 'GREETING'];

detectConversation(tokens) → 'GREETING' | 'FAREWELL' | 'THANKS' | null
```
- Только точное совпадение маркеров (без весов, без фаззи); маркеры могут быть и униграммами, и биграммами.
- Если совпали маркеры нескольких классов — возвращается класс с наибольшим приоритетом по `CONVERSATIONAL_PRECEDENCE` (`FAREWELL` > `THANKS` > `GREETING`).
- Если ни одного маркера нет — `null`.
- «алё»/«ало» намеренно НЕ являются маркерами (слишком близки к шуму).

### Форма экспорта `intents.js`
```js
export const INTENTS = {
  BOOK: {
    unigrams: [{ token: 'записаться', weight: 2.0 }, /* ... */ ],
    bigrams:  [{ token: 'за писаться', weight: 3.0 }, { token: 'записаться к', weight: 3.0 }, /* ... */ ],
    referenceScore: 6.0   // сырой скор чистой эталонной фразы BOOK; используется для нормализации уверенности
  },
  // ... CANCEL, RESCHEDULE, INFO, OPERATOR, COMPLAINT
  UNCLEAR: { unigrams: [], bigrams: [], referenceScore: 1 }  // без словаря; фолбэк-намерение
};
```
- Каждое скоримое намерение имеет `unigrams`, `bigrams` и константу `referenceScore`.
- У `UNCLEAR` пустой словарь.
- Веса берутся из констант `thresholds.js` (`strongBigramWeight`, `mediumUnigramWeight`, `weakUnigramWeight`).

### `score(tokens, intents) → { scores, matched }`
- `tokens = { unigrams, bigrams }`.
- `scores`: объект с ключами по 6 скоримым намерениям → сумма весов совпавших записей (0, если ничего не совпало).
- `matched`: объект с ключами по 6 скоримым намерениям → массив совпавших строк `token` записей (для отладки и диалогового движка).
- Только точное совпадение (членство в множестве / линейный скан по малому словарю). Чистая.

### `fuzzy(tokens, intents, thresholds) → { scores, matched }`
- Возвращает **частичные добавки** (дельты) для слияния с точными скорами в `classify`.
- Для каждой униграммы с `length ≥ minTokenLenForFuzzy` вычислить расстояние Левенштейна до каждой записи словаря; если `distance > 0` и `partialWeight = (1 − distance/len) * entryWeight` превышает небольшой пол, добавить к дельте этого намерения и записать пару в `matched` (например, `принести≈перенести (+1.0)`).
- Токены, уже совпавшие точно, пропускаются (избежать двойного счёта).
- Чистая; ограничена `|tokens| × |vocab|` (оба малы).

### `classify(text) → result`
- Пайплайн:
  1. `normalized = normalize(text)`; если guard-fail → вернуть результат `UNCLEAR`.
  2. `tokens = tokenize(normalized)`.
  3. `conversation = detectConversation(tokens)` — конверсационный кандидат (`GREETING`/`FAREWELL`/`THANKS`/`null`).
  4. `{ scores, matched } = score(tokens, INTENTS)`.
  5. Если `max(scores.values()) < fallbackThreshold` → слить `fuzzy(tokens, INTENTS, THRESHOLDS)` в `scores`/`matched`.
  6. Резолвинг (двухуровневый):
     - **Уровень 1 — доменный:** `confidence_i = clamp(score_i / referenceScore_i, 0, 1)`; выбрать `top1`, `top2`. Если `confidence_top1 ≥ minConfidence` И `confidence_top1 − confidence_top2 ≥ ambiguityGap` → `intent = top1`, `confidence = confidence_top1`.
     - **Уровень 2 — конверсационный:** иначе если `max(scores) < domainSilenceThreshold` И `conversation ≠ null` → `intent = conversation`, `confidence = conversationalConfidence`.
     - **Уровень 3 — иначе** → `UNCLEAR` (с `confidence` лучшего отвергнутого доменного кандидата и полными `scores`/`matched`).
  7. Собрать и вернуть `{ intent, confidence, scores, matched }`.

---

## Граф зависимостей модулей

```
index.js
  └── classify.js
        ├── thresholds.js       (только константы)
        ├── normalize.js         (guard + очистка)
        ├── tokenize.js          (униграммы + биграммы)
        ├── conversational.js    (конверсационные маркеры + приоритет; читает thresholds)
        ├── intents.js           (доменный словарь + по-намерению referenceScore; читает thresholds для весов)
        ├── score.js             (читает intents)
        └── fuzzy.js             (читает intents + thresholds)
```

- `thresholds.js`, `intents.js` и `conversational.js` — **листовые модули данных** (нет зависимостей, кроме thresholds для весов/приоритета).
- `normalize.js` и `tokenize.js` — **чистые преобразования** без перекрёстных зависимостей (tokenize зависит только от своего входа; normalize зависит только от thresholds).
- `score.js` и `fuzzy.js` зависят от `intents.js` (и `fuzzy` от `thresholds.js`).
- `classify.js` — единственный оркестратор; единственное место, знающее порядок этапов.
- Без циклов. Ни один модуль не импортирует `classify.js` или `index.js`.

---

## Раскладка файлов (финальная)

```
med_zvon/
  package.json                 # { "type": "module", "scripts": { "test": "node --test" } }
  .gitignore
  README.md                    # опционально: краткое описание + как запускать тесты + встроенная схема
  src/
    thresholds.js
    thresholds.test.js
    normalize.js
    normalize.test.js
    tokenize.js
    tokenize.test.js
    conversational.js
    conversational.test.js
    intents.js
    intents.test.js
    score.js
    score.test.js
    fuzzy.js
    fuzzy.test.js
    classify.js
    classify.test.js
    index.js
    index.test.js
    examples.test.js           # приёмочный гейт из 11 кейсов
  docs/
    schema.mmd                 # mermaid-схема пайплайна (читается без кода)
    reasoning.md               # письменное рассуждение (порядок этапов, метод, низкая уверенность)
  plans/                       # этот роадмап (не сдаётся, но хранится для прослеживаемости)
```

---

## Соответствие coding-standards

- ESM, `"type": "module"`, ноль зависимостей, только stdlib Node + `node:test`/`node:assert`.
- Функции `camelCase`, файлы `kebab-case.js`, одна ответственность на файл.
- Чистые функции в ядре; без I/O, без `console.log`, без комментариев (если не просили).
- Детерминизм: без `Date.now`/`Math.random` в решающем пути; все числа в `thresholds.js`.
- Безопасность: проходы `O(n)`, литеральные ReDoS-безопасные паттерны, лимит длины входа, `null`/пусто → `UNCLEAR` (никогда не throw), без `eval`/`new Function`/`child_process`.
