import { minTokenLenForStem } from './thresholds.js';

const VOWELS = new Set(['а', 'е', 'и', 'о', 'у', 'ы', 'э', 'ю', 'я']);
const CYRILLIC = /[а-яё]/;

const STEM_SKIP = new Set(['запись']);

const SUFFIXES = [
  'уются',
  'ается',
  'яется',
  'етесь',
  'ешься',
  'итесь',
  'имся',
  'утся',
  'аться',
  'иться',
  'уюсь',
  'усь',
  'ться',
  'ите',
  'ете',
  'ть',
  'ти',
  'ишь',
  'ешь',
  'ит',
  'ет',
  'им',
  'ем',
  'ят',
  'ут',
  'ю',
  'у',
  'ом',
  'ами',
  'ой',
  'а',
  'я',
  'ы',
  'и',
];

const SUPP = {
  запиш: 'запис',
  записа: 'запис',
  жал: 'жалоб',
};

export function stemToken(word) {
  if (typeof word !== 'string' || word === '') return word;
  if (word.length < minTokenLenForStem) return word;
  if (STEM_SKIP.has(word)) return word;
  if (!CYRILLIC.test(word)) return word;

  let stem = word.replace('ё', 'е');

  for (const suffix of SUFFIXES) {
    if (stem.endsWith(suffix)) {
      stem = stem.slice(0, -suffix.length);
      break;
    }
  }

  if (!hasVowel(stem)) return word;
  if (SUPP[stem]) stem = SUPP[stem];
  return stem;
}

export function buildStemIndex(intents) {
  const index = new Map();
  for (const [name, intent] of Object.entries(intents)) {
    if (name === 'UNCLEAR') continue;
    for (const entry of intent.unigrams) {
      const stem = stemToken(entry.token);
      if (!index.has(stem)) index.set(stem, []);
      index.get(stem).push({ intent: name, token: entry.token, weight: entry.weight });
    }
  }
  return index;
}

export function stemMatch(tokens, intents, stemIndex, thresholds) {
  const scores = {};
  const matched = {};
  for (const k of DOMAIN_KEYS) {
    scores[k] = 0;
    matched[k] = [];
  }

  const exactSet = new Set();
  for (const k of DOMAIN_KEYS) {
    for (const tok of intents[k].unigrams) {
      if (tokens.unigrams.includes(tok.token)) exactSet.add(tok.token);
    }
  }

  for (const tok of tokens.unigrams) {
    if (exactSet.has(tok)) continue;
    const stem = stemToken(tok);
    if (stem === tok) continue;
    const entries = stemIndex.get(stem);
    if (!entries) continue;

    const byIntent = {};
    for (const entry of entries) {
      if (!byIntent[entry.intent] || entry.weight > byIntent[entry.intent].weight) {
        byIntent[entry.intent] = entry.weight;
      }
    }
    for (const [intent, weight] of Object.entries(byIntent)) {
      scores[intent] += weight;
      matched[intent].push(entryToken(stemIndex, stem, intent));
    }
  }

  return { scores, matched };
}

function entryToken(stemIndex, stem, intent) {
  const entry = stemIndex.get(stem).find((e) => e.intent === intent);
  return entry.token;
}

function hasVowel(word) {
  for (const ch of word) {
    if (VOWELS.has(ch)) return true;
  }
  return false;
}

const DOMAIN_KEYS = ['BOOK', 'CANCEL', 'RESCHEDULE', 'INFO', 'OPERATOR', 'COMPLAINT'];
