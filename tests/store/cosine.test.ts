// tests/store/cosine.test.ts
import { describe, it, expect } from 'vitest';
import { cosineSimilarity } from '../../src/store/cosine';

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
  });

  it('returns -1 for opposite vectors', () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });

  it('returns 0 when either vector is zero-magnitude', () => {
    expect(cosineSimilarity([0, 0], [1, 2])).toBe(0);
    expect(cosineSimilarity([1, 2], [0, 0])).toBe(0);
  });

  it('handles multi-dimensional vectors', () => {
    const a = [0.2, 0.5, 0.3, 0.1];
    const b = [0.2, 0.5, 0.3, 0.1];
    expect(cosineSimilarity(a, b)).toBeCloseTo(1);
  });

  it('similarity is symmetric', () => {
    const a = [0.1, 0.9, 0.4];
    const b = [0.8, 0.2, 0.6];
    expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a));
  });

  it('returns a value between -1 and 1 for arbitrary vectors', () => {
    const a = [3, 1, 4, 1, 5];
    const b = [2, 7, 1, 8, 2];
    const result = cosineSimilarity(a, b);
    expect(result).toBeGreaterThanOrEqual(-1);
    expect(result).toBeLessThanOrEqual(1);
  });
});
