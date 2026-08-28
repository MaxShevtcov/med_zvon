export const guardMinLength = 3;
export const maxInputLen = 500;
export const minConfidence = 0.35;
export const ambiguityGap = 0.15;
export const fallbackThreshold = 3.0;
export const minTokenLenForFuzzy = 4;
export const strongBigramWeight = 3.0;
export const mediumUnigramWeight = 2.0;
export const weakUnigramWeight = 0.3;
export const fuzzyMinPartial = 1.1;

export const THRESHOLDS = Object.freeze({
  guardMinLength,
  maxInputLen,
  minConfidence,
  ambiguityGap,
  fallbackThreshold,
  minTokenLenForFuzzy,
  strongBigramWeight,
  mediumUnigramWeight,
  weakUnigramWeight,
  fuzzyMinPartial,
});
