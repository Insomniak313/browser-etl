import { describe, it, expect } from 'vitest';
import { MapTransformer } from '../../src/transformers/map';

describe('MapTransformer', () => {
  let transformer: MapTransformer;

  beforeEach(() => {
    transformer = new MapTransformer();
  });

  describe('transform method', () => {
    it('should transform array data', async () => {
      const data = [1, 2, 3, 4, 5];
      const result = await transformer.transform(data, {
        fn: (item: number) => item * 2
      });

      expect(result).toEqual([2, 4, 6, 8, 10]);
    });

    it('should transform object data', async () => {
      const data = { a: 1, b: 2, c: 3 };
      const result = await transformer.transform(data, {
        fn: ({ value }: { value: number }) => value * 2
      });

      expect(result).toEqual({ a: 2, b: 4, c: 6 });
    });

    it('should transform object data with key-value mapping', async () => {
      const data = { a: 1, b: 2, c: 3 };
      const result = await transformer.transform(data, {
        fn: ({ key, value }: { key: string; value: number }) => ({
          key: key.toUpperCase(),
          value: value * 2
        })
      });

      expect(result).toEqual({ A: 2, B: 4, C: 6 });
    });

    it('should transform primitive data', async () => {
      const data = 42;
      const result = await transformer.transform(data, {
        fn: (item: number) => item * 2
      });

      expect(result).toBe(84);
    });

    it('should transform string data', async () => {
      const data = 'hello';
      const result = await transformer.transform(data, {
        fn: (item: string) => item.toUpperCase()
      });

      expect(result).toBe('HELLO');
    });

    it('should handle empty array', async () => {
      const data: any[] = [];
      const result = await transformer.transform(data, {
        fn: (item: any) => item * 2
      });

      expect(result).toEqual([]);
    });

    it('should handle empty object', async () => {
      const data = {};
      const result = await transformer.transform(data, {
        fn: ({ value }: { value: any }) => value * 2
      });

      expect(result).toEqual({});
    });

    it('should handle null data', async () => {
      const data = null;
      const result = await transformer.transform(data, {
        fn: (item: any) => item
      });

      expect(result).toBeNull();
    });

    it('should handle undefined data', async () => {
      const data = undefined;
      const result = await transformer.transform(data, {
        fn: (item: any) => item
      });

      expect(result).toBeUndefined();
    });

    it('should throw error when function is missing', async () => {
      await expect(transformer.transform([1, 2, 3], {} as any))
        .rejects.toThrow('Map function is required');
    });

    it('should handle complex object transformation', async () => {
      const data = {
        users: [
          { id: 1, name: 'John' },
          { id: 2, name: 'Jane' }
        ]
      };

      const result = await transformer.transform(data, {
        fn: ({ key, value }: { key: string; value: any }) => {
          if (key === 'users' && Array.isArray(value)) {
            return {
              key: 'people',
              value: value.map((user: any) => ({ ...user, active: true }))
            };
          }
          return { key, value };
        }
      });

      expect(result).toEqual({
        people: [
          { id: 1, name: 'John', active: true },
          { id: 2, name: 'Jane', active: true }
        ]
      });
    });
  });

  describe('supports method', () => {
    it('should support config with function', () => {
      expect(transformer.supports({ fn: () => {} })).toBe(true);
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
      expect(transformer.name).toBe('map');
    });
  });
});