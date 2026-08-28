import { classify } from '../src/index.js';
import readline from 'node:readline';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log('МедЗвон — интерактивный классификатор');
console.log('Введите фразу, пустая строка или exit — выход.\n');

rl.setPrompt('> ');
rl.prompt();

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (trimmed === '' || trimmed === 'exit' || trimmed === 'quit') {
    rl.close();
    return;
  }

  const r = classify(line);
  console.log(`  intent:     ${r.intent}`);
  console.log(`  confidence: ${r.confidence.toFixed(2)}`);
  console.log(`  scores:     ${formatScores(r.scores)}`);
  console.log(`  matched:    ${formatMatched(r.matched)}`);
  console.log('');

  rl.prompt();
});

rl.on('close', () => {
  process.exit(0);
});

function formatScores(scores) {
  return Object.entries(scores)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k}=${v.toFixed(2)}`)
    .join('  ') || '(все 0)';
}

function formatMatched(matched) {
  const parts = Object.entries(matched)
    .filter(([, arr]) => arr.length > 0)
    .map(([k, arr]) => `${k}: ${arr.join(', ')}`);
  return parts.join('  ') || '(ничего)';
}
