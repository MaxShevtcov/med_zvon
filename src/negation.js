const NEGATION = 'не';
const CONTRAST = new Set(['а', 'но']);

export function negatedTokenIndexes(tokens) {
  const indexes = new Set();

  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i] !== NEGATION || isOperatorPhrase(tokens, i)) continue;

    let end = tokens.length;
    for (let j = i + 1; j < tokens.length; j++) {
      if (CONTRAST.has(tokens[j])) {
        end = j;
        break;
      }
    }

    for (let j = i + 1; j < end; j++) indexes.add(j);
  }

  return indexes;
}

function isOperatorPhrase(tokens, index) {
  return tokens[index + 1] === 'с' && tokens[index + 2] === 'роботом';
}
