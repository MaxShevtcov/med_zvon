import { INTENTS } from './intents.js';

const DOMAIN_KEYS = ['BOOK', 'CANCEL', 'RESCHEDULE', 'INFO', 'OPERATOR', 'COMPLAINT'];

export function levenshtein(a, b) {
  const alen = a.length;
  const blen = b.length;
  const dp = Array.from({ length: alen + 1 }, (_, i) => {
    const row = new Array(blen + 1);
    row[0] = i;
    return row;
  });
  for (let j = 0; j <= blen; j++) dp[0][j] = j;
  for (let i = 1; i <= alen; i++) {
    for (let j = 1; j <= blen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[alen][blen];
}

class FuzzyConfig {
  constructor(fuzzyMinPartial, minTokenLenForFuzzy) {
    this.fuzzyMinPartial = fuzzyMinPartial;
    this.minTokenLenForFuzzy = minTokenLenForFuzzy;
  }
}

export function fuzzy(tokens, intents, thresholds) {
  const cfg = new FuzzyConfig(thresholds.fuzzyMinPartial, thresholds.minTokenLenForFuzzy);

  const scores = {};
  const matched = {};
  for (const k of DOMAIN_KEYS) {
    scores[k] = 0;
    matched[k] = [];
  }

  const flat = [];
  for (const [name, intent] of Object.entries(intents)) {
    if (name === 'UNCLEAR') continue;
    for (const entry of intent.unigrams) {
      flat.push({ token: entry.token, weight: entry.weight, intent: name });
    }
  }

  for (const tok of tokens.unigrams) {
    if (tok.length < cfg.minTokenLenForFuzzy) continue;
    for (const entry of flat) {
      const distance = levenshtein(tok, entry.token);
      if (distance === 0) continue;
      const partialWeight = (1 - distance / tok.length) * entry.weight;
      if (partialWeight >= cfg.fuzzyMinPartial) {
        scores[entry.intent] += partialWeight;
        matched[entry.intent].push(
          `${tok}≈${entry.token} (+${partialWeight.toFixed(2)})`,
        );
      }
    }
  }

  return { scores, matched };
}
