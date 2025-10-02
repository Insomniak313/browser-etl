import { describe, it, expect } from 'vitest';
import { FilterTransformer } from '../../src/transformers/filter';

describe('FilterTransformer', () => {
  let transformer: FilterTransformer;

  beforeEach(() => {
    transformer = new FilterTransformer();
  });

  it('should filter array data', async () => {
    const data = [1, 2, 3, 4, 5];
    const result = await transformer.transform(data, {
      fn: (item: number) => item > 3
    });

    expect(result).toEqual([4, 5]);
  });

  it('should filter object data', async () => {
    const data = { a: 1, b: 2, c: 3 };
    const result = await transformer.transform(data, {
      fn: ({ value }: { value: number }) => value > 1
    });

    expect(result).toEqual({ b: 2, c: 3 });
  });

  it('should filter primitive data', async () => {
    const data = 42;
    const result = await transformer.transform(data, {
      fn: (item: number) => item > 40
    });

    expect(result).toBe(42);
  });

  it('should return null for filtered primitive data', async () => {
    const data = 42;
    const result = await transformer.transform(data, {
      fn: (item: number) => item < 40
    });

    expect(result).toBeNull();
  });

  it('should handle empty array', async () => {
    const data: any[] = [];
    const result = await transformer.transform(data, {
      fn: (item: any) => true
    });

    expect(result).toEqual([]);
  });

  it('should handle empty object', async () => {
    const data = {};
    const result = await transformer.transform(data, {
      fn: ({ value }: { value: any }) => true
    });

    expect(result).toEqual({});
  });

  it('should throw error when no function provided', async () => {
    await expect(transformer.transform([1, 2, 3], {} as any))
      .rejects.toThrow('Filter function is required');
  });

  it('should support configuration validation', () => {
    expect(transformer.supports({ fn: () => true })).toBe(true);
    expect(transformer.supports({})).toBe(false);
    expect(transformer.supports({ fn: 'not a function' })).toBe(false);
  });

  it('should have correct name', () => {
    expect(transformer.name).toBe('filter');
  });
});