export function tokenize(normalized) {
  if (!normalized) return { unigrams: [], bigrams: [] };
  const unigrams = normalized.split(' ').filter(Boolean);
  const bigrams = [];
  for (let i = 0; i < unigrams.length - 1; i++) {
    bigrams.push(unigrams[i] + ' ' + unigrams[i + 1]);
  }
  return { unigrams, bigrams };
}
