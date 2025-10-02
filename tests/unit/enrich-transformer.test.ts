import { describe, it, expect, vi } from 'vitest';
import { EnrichTransformer } from '../../src/transformers/enrich';

describe('EnrichTransformer', () => {
  let transformer: EnrichTransformer;

  beforeEach(() => {
    transformer = new EnrichTransformer();
  });

  describe('transform method', () => {
    it('should enrich array data in parallel', async () => {
      const data = [1, 2, 3, 4, 5];
      const enrichFn = vi.fn().mockImplementation(async (item: number) => item * 2);

      const result = await transformer.transform(data, {
        fn: enrichFn,
        parallel: true,
        batchSize: 2
      });

      expect(result).toEqual([2, 4, 6, 8, 10]);
      expect(enrichFn).toHaveBeenCalledTimes(5);
    });

    it('should enrich array data sequentially', async () => {
      const data = [1, 2, 3];
      const enrichFn = vi.fn().mockImplementation(async (item: number) => item * 2);

      const result = await transformer.transform(data, {
        fn: enrichFn,
        parallel: false
      });

      expect(result).toEqual([2, 4, 6]);
      expect(enrichFn).toHaveBeenCalledTimes(3);
    });

    it('should enrich object data in parallel', async () => {
      const data = { a: 1, b: 2, c: 3 };
      const enrichFn = vi.fn().mockImplementation(async ({ value }: { value: number }) => value * 2);

      const result = await transformer.transform(data, {
        fn: enrichFn,
        parallel: true,
        batchSize: 2
      });

      expect(result).toEqual({ a: 2, b: 4, c: 6 });
      expect(enrichFn).toHaveBeenCalledTimes(3);
    });

    it('should enrich object data sequentially', async () => {
      const data = { a: 1, b: 2 };
      const enrichFn = vi.fn().mockImplementation(async ({ value }: { value: number }) => value * 2);

      const result = await transformer.transform(data, {
        fn: enrichFn,
        parallel: false
      });

      expect(result).toEqual({ a: 2, b: 4 });
      expect(enrichFn).toHaveBeenCalledTimes(2);
    });

    it('should enrich primitive data', async () => {
      const data = 42;
      const enrichFn = vi.fn().mockImplementation(async (item: number) => item * 2);

      const result = await transformer.transform(data, {
        fn: enrichFn
      });

      expect(result).toBe(84);
      expect(enrichFn).toHaveBeenCalledWith(42);
    });

    it('should handle empty array', async () => {
      const data: any[] = [];
      const enrichFn = vi.fn().mockImplementation(async (item: any) => item);

      const result = await transformer.transform(data, {
        fn: enrichFn
      });

      expect(result).toEqual([]);
      expect(enrichFn).not.toHaveBeenCalled();
    });

    it('should handle empty object', async () => {
      const data = {};
      const enrichFn = vi.fn().mockImplementation(async ({ value }: { value: any }) => value);

      const result = await transformer.transform(data, {
        fn: enrichFn
      });

      expect(result).toEqual({});
      expect(enrichFn).not.toHaveBeenCalled();
    });

    it('should handle null data', async () => {
      const data = null;
      const enrichFn = vi.fn().mockImplementation(async (item: any) => item);

      const result = await transformer.transform(data, {
        fn: enrichFn
      });

      expect(result).toBeNull();
      expect(enrichFn).toHaveBeenCalledWith(null);
    });

    it('should handle undefined data', async () => {
      const data = undefined;
      const enrichFn = vi.fn().mockImplementation(async (item: any) => item);

      const result = await transformer.transform(data, {
        fn: enrichFn
      });

      expect(result).toBeUndefined();
      expect(enrichFn).toHaveBeenCalledWith(undefined);
    });

    it('should throw error when function is missing', async () => {
      await expect(transformer.transform([1, 2, 3], {} as any))
        .rejects.toThrow('Enrichment function is required');
    });

    it('should handle async function errors', async () => {
      const data = [1, 2, 3];
      const enrichFn = vi.fn().mockImplementation(async (item: number) => {
        if (item === 2) {
          throw new Error('Enrichment failed');
        }
        return item * 2;
      });

      await expect(transformer.transform(data, {
        fn: enrichFn
      })).rejects.toThrow('Enrichment failed');
    });

    it('should use default batch size', async () => {
      const data = Array.from({ length: 15 }, (_, i) => i + 1);
      const enrichFn = vi.fn().mockImplementation(async (item: number) => item * 2);

      const result = await transformer.transform(data, {
        fn: enrichFn,
        parallel: true
      });

      expect(result).toHaveLength(15);
      expect(result[0]).toBe(2);
      expect(result[14]).toBe(30);
    });

    it('should handle custom batch size', async () => {
      const data = [1, 2, 3, 4, 5];
      const enrichFn = vi.fn().mockImplementation(async (item: number) => item * 2);

      const result = await transformer.transform(data, {
        fn: enrichFn,
        parallel: true,
        batchSize: 3
      });

      expect(result).toEqual([2, 4, 6, 8, 10]);
    });

    it('should handle complex enrichment', async () => {
      const data = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ];

      const enrichFn = vi.fn().mockImplementation(async (item: any) => {
        // Simulate async API call
        await new Promise(resolve => setTimeout(resolve, 10));
        return {
          ...item,
          enriched: true,
          timestamp: Date.now()
        };
      });

      const result = await transformer.transform(data, {
        fn: enrichFn,
        parallel: true
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 1,
        name: 'John',
        enriched: true
      });
      expect(result[1]).toMatchObject({
        id: 2,
        name: 'Jane',
        enriched: true
      });
    });
  });

  describe('supports method', () => {
    it('should support config with function', () => {
      expect(transformer.supports({ fn: async () => {} })).toBe(true);
    });

    it('should not support config without function', () => {
      expect(transformer.supports({})).toBe(false);
    });

    it('should not support config with non-function', () => {
      expect(transformer.supports({ fn: 'not a function' })).toBe(false);
    });
  });

  describe('name property', () => {
    it('should have correct name', () => {
      expect(transformer.name).toBe('enrich');
    });
  });
});