export function score(tokens, intents) {
  const scores = {};
  const matched = {};
  const unigramSet = new Set(tokens.unigrams);
  const bigramSet = new Set(tokens.bigrams);

  for (const [name, intent] of Object.entries(intents)) {
    if (name === 'UNCLEAR') continue;
    scores[name] = 0;
    matched[name] = [];

    for (const entry of intent.unigrams) {
      if (unigramSet.has(entry.token)) {
        scores[name] += entry.weight;
        matched[name].push(entry.token);
      }
    }
    for (const entry of intent.bigrams) {
      if (bigramSet.has(entry.token)) {
        scores[name] += entry.weight;
        matched[name].push(entry.token);
      }
    }
  }

  return { scores, matched };
}
