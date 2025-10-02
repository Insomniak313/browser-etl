import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JoinTransformer } from '../../src/transformers/join';

// Mock fetch
global.fetch = vi.fn();

describe('JoinTransformer', () => {
  let transformer: JoinTransformer;

  beforeEach(() => {
    transformer = new JoinTransformer();
    vi.clearAllMocks();
  });

  describe('transform method', () => {
    it('should perform nested join with API data', async () => {
      const leftData = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ];

      const rightData = [
        { id: 1, age: 30 },
        { id: 2, age: 25 }
      ];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rightData)
      });

      const result = await transformer.transform(leftData, {
        key: 'id',
        mode: 'nested',
        type: 'api',
        url: 'https://api.example.com/users'
      });

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/users', undefined);
      expect(result).toEqual([
        { id: 1, name: 'John', age: 30 },
        { id: 2, name: 'Jane', age: 25 }
      ]);
    });

    it('should perform nested join with local data', async () => {
      const leftData = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ];

      const rightData = [
        { id: 1, age: 30 },
        { id: 2, age: 25 }
      ];

      const result = await transformer.transform(leftData, {
        key: 'id',
        mode: 'nested',
        type: 'data',
        data: rightData
      });

      expect(result).toEqual([
        { id: 1, name: 'John', age: 30 },
        { id: 2, name: 'Jane', age: 25 }
      ]);
    });

    it('should perform parallel join', async () => {
      const leftData = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ];

      const rightData = [
        { id: 1, age: 30 },
        { id: 3, city: 'New York' }
      ];

      const result = await transformer.transform(leftData, {
        key: 'id',
        mode: 'parallel',
        type: 'data',
        data: rightData
      });

      expect(result).toEqual([
        { id: 1, name: 'John', age: 30 },
        { id: 2, name: 'Jane' },
        { id: 3, city: 'New York' }
      ]);
    });

    it('should use custom join function', async () => {
      const leftData = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ];

      const rightData = [
        { id: 1, age: 30 },
        { id: 2, age: 25 }
      ];

      const customJoinFn = (left: any, right: any) => ({
        ...left,
        ...right,
        joined: true
      });

      const result = await transformer.transform(leftData, {
        key: 'id',
        mode: 'nested',
        type: 'data',
        data: rightData,
        joinFn: customJoinFn
      });

      expect(result).toEqual([
        { id: 1, name: 'John', age: 30, joined: true },
        { id: 2, name: 'Jane', age: 25, joined: true }
      ]);
    });

    it('should handle nested key paths', async () => {
      const leftData = [
        { user: { id: 1 }, name: 'John' },
        { user: { id: 2 }, name: 'Jane' }
      ];

      const rightData = [
        { user: { id: 1 }, age: 30 },
        { user: { id: 2 }, age: 25 }
      ];

      const result = await transformer.transform(leftData, {
        key: 'user.id',
        mode: 'nested',
        type: 'data',
        data: rightData
      });

      expect(result).toEqual([
        { user: { id: 1 }, name: 'John', age: 30 },
        { user: { id: 2 }, name: 'Jane', age: 25 }
      ]);
    });

    it('should handle missing join data', async () => {
      const leftData = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' }
      ];

      const rightData = [
        { id: 1, age: 30 }
      ];

      const result = await transformer.transform(leftData, {
        key: 'id',
        mode: 'nested',
        type: 'data',
        data: rightData
      });

      expect(result).toEqual([
        { id: 1, name: 'John', age: 30 },
        { id: 2, name: 'Jane' }
      ]);
    });

    it('should handle API fetch error', async () => {
      const leftData = [{ id: 1, name: 'John' }];

      (fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found'
      });

      await expect(transformer.transform(leftData, {
        key: 'id',
        mode: 'nested',
        type: 'api',
        url: 'https://api.example.com/users'
      })).rejects.toThrow('Failed to fetch join data: Not Found');
    });

    it('should throw error when key is missing', async () => {
      const leftData = [{ id: 1, name: 'John' }];

      await expect(transformer.transform(leftData, {
        mode: 'nested',
        type: 'data',
        data: []
      } as any)).rejects.toThrow('Join key is required');
    });

    it('should throw error for invalid configuration', async () => {
      const leftData = [{ id: 1, name: 'John' }];

      await expect(transformer.transform(leftData, {
        key: 'id',
        mode: 'nested',
        type: 'api'
        // Missing url
      })).rejects.toThrow('Invalid join configuration');
    });

    it('should throw error when data is not arrays', async () => {
      const leftData = { id: 1, name: 'John' };
      const rightData = [{ id: 1, age: 30 }];

      await expect(transformer.transform(leftData, {
        key: 'id',
        mode: 'nested',
        type: 'data',
        data: rightData
      })).rejects.toThrow('Both datasets must be arrays for joining');
    });

    it('should handle empty datasets', async () => {
      const leftData: any[] = [];
      const rightData: any[] = [];

      const result = await transformer.transform(leftData, {
        key: 'id',
        mode: 'nested',
        type: 'data',
        data: rightData
      });

      expect(result).toEqual([]);
    });

    it('should handle API request with options', async () => {
      const leftData = [{ id: 1, name: 'John' }];
      const rightData = [{ id: 1, age: 30 }];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(rightData)
      });

      await transformer.transform(leftData, {
        key: 'id',
        mode: 'nested',
        type: 'api',
        url: 'https://api.example.com/users',
        options: { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      });

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    });
  });

  describe('supports method', () => {
    it('should support valid config', () => {
      expect(transformer.supports({
        key: 'id',
        mode: 'nested',
        type: 'data',
        data: []
      })).toBe(true);
    });

    it('should support config with url', () => {
      expect(transformer.supports({
        key: 'id',
        mode: 'nested',
        type: 'api',
        url: 'https://api.example.com'
      })).toBe(true);
    });

    it('should not support config without key', () => {
      expect(transformer.supports({
        mode: 'nested',
        type: 'data',
        data: []
      })).toBe(false);
    });

    it('should not support config without mode', () => {
      expect(transformer.supports({
        key: 'id',
        type: 'data',
        data: []
      })).toBe(false);
    });

    it('should not support config without type', () => {
      expect(transformer.supports({
        key: 'id',
        mode: 'nested',
        data: []
      })).toBe(false);
    });

    it('should not support config without data or url', () => {
      expect(transformer.supports({
        key: 'id',
        mode: 'nested',
        type: 'data'
      })).toBe(false);
    });
  });

  describe('name property', () => {
    it('should have correct name', () => {
      expect(transformer.name).toBe('join');
    });
  });
});