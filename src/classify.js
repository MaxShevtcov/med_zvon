import { normalize } from './normalize.js';
import { tokenize } from './tokenize.js';
import { INTENTS } from './intents.js';
import { score } from './score.js';
import { fuzzy } from './fuzzy.js';
import { buildStemIndex, stemMatch } from './stem.js';
import {
  THRESHOLDS,
  minConfidence,
  ambiguityGap,
  fallbackThreshold,
} from './thresholds.js';

const DOMAIN_KEYS = ['BOOK', 'CANCEL', 'RESCHEDULE', 'INFO', 'OPERATOR', 'COMPLAINT'];
const ALL_INTENTS = [...DOMAIN_KEYS, 'UNCLEAR'];
const STEM_INDEX = buildStemIndex(INTENTS);

export function classify(text) {
  let normalized = null;
  try {
    normalized = normalize(text);
  } catch {
    normalized = null;
  }

  if (normalized === null) {
    return fallbackResult('UNCLEAR', 0);
  }

  const tokens = tokenize(normalized);

  const exact = score(tokens, INTENTS);
  const scores = { ...exact.scores };
  const matched = {};
  for (const k of DOMAIN_KEYS) matched[k] = [...exact.matched[k]];

  let maxExact = 0;
  for (const v of Object.values(scores)) {
    if (v > maxExact) maxExact = v;
  }

  if (maxExact < fallbackThreshold) {
    const st = stemMatch(tokens, INTENTS, STEM_INDEX, THRESHOLDS);
    for (const k of DOMAIN_KEYS) {
      scores[k] += st.scores[k];
      matched[k] = matched[k].concat(st.matched[k]);
    }
    const fz = fuzzy(tokens, INTENTS, THRESHOLDS);
    for (const k of DOMAIN_KEYS) {
      scores[k] += fz.scores[k];
      matched[k] = matched[k].concat(fz.matched[k]);
    }
  }

  const { intent, confidence } = resolve(scores);
  return { intent, confidence, scores, matched };
}

export function resolve(scores) {
  const ranked = DOMAIN_KEYS
    .map((k) => ({ name: k, confidence: clamp(scores[k] / INTENTS[k].referenceScore, 0, 1) }))
    .sort((a, b) => b.confidence - a.confidence || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

  const top1 = ranked[0];
  const top2 = ranked[1];

  if (top1.confidence >= minConfidence && top1.confidence - top2.confidence >= ambiguityGap) {
    return { intent: top1.name, confidence: top1.confidence };
  }

  return { intent: 'UNCLEAR', confidence: top1.confidence };
}

function fallbackResult(intent, confidence) {
  const scores = {};
  const matched = {};
  for (const k of DOMAIN_KEYS) {
    scores[k] = 0;
    matched[k] = [];
  }
  return { intent, confidence, scores, matched };
}

function clamp(x, lo, hi) {
  if (x < lo) return lo;
  if (x > hi) return hi;
  return x;
}
