import { guardMinLength, maxInputLen } from './thresholds.js';

export function normalize(text) {
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (trimmed.length < guardMinLength) return null;
  const lower = trimmed.toLowerCase();
  const stripped = lower.replace(/[^a-zа-яё0-9\s]/g, ' ');
  const collapsed = stripped.replace(/\s+/g, ' ').trim();
  if (collapsed.length < guardMinLength) return null;
  return collapsed.slice(0, maxInputLen);
}
