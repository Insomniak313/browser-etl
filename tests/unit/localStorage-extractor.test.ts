import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LocalStorageExtractor } from '../../src/extractors/localStorage';

describe('LocalStorageExtractor', () => {
  let extractor: LocalStorageExtractor;
  let mockLocalStorage: any;

  beforeEach(() => {
    extractor = new LocalStorageExtractor();
    
    // Mock localStorage
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('extract method', () => {
    it('should extract JSON data from localStorage', async () => {
      const testData = { name: 'John', age: 30 };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testData));

      const result = await extractor.extract({ key: 'test-key' });

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
      expect(result).toEqual(testData);
    });

    it('should extract string data from localStorage', async () => {
      const testData = 'simple string';
      mockLocalStorage.getItem.mockReturnValue(testData);

      const result = await extractor.extract({ key: 'test-key' });

      expect(result).toBe(testData);
    });

    it('should return null when key does not exist', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await extractor.extract({ key: 'non-existent-key' });

      expect(result).toBeNull();
    });

    it('should return raw string when parse is disabled', async () => {
      const testData = '{"name":"John","age":30}';
      mockLocalStorage.getItem.mockReturnValue(testData);

      const result = await extractor.extract({ 
        key: 'test-key', 
        parse: false 
      });

      expect(result).toBe(testData);
    });

    it('should return string when JSON parsing fails', async () => {
      const invalidJson = 'invalid json string';
      mockLocalStorage.getItem.mockReturnValue(invalidJson);

      const result = await extractor.extract({ key: 'test-key' });

      expect(result).toBe(invalidJson);
    });

    it('should throw error when key is missing', async () => {
      await expect(extractor.extract({} as any))
        .rejects.toThrow('Key is required for localStorage extraction');
    });

    it('should throw error when localStorage is not available', async () => {
      // Mock window without localStorage
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true
      });

      await expect(extractor.extract({ key: 'test-key' }))
        .rejects.toThrow('localStorage is not available in this environment');
    });

    it('should throw error when window is not available', async () => {
      // Mock undefined window
      const originalWindow = global.window;
      delete (global as any).window;

      await expect(extractor.extract({ key: 'test-key' }))
        .rejects.toThrow('localStorage is not available in this environment');

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('supports method', () => {
    it('should support config with string key', () => {
      expect(extractor.supports({ key: 'test-key' })).toBe(true);
    });

    it('should not support config without key', () => {
      expect(extractor.supports({})).toBe(false);
    });

    it('should not support config with non-string key', () => {
      expect(extractor.supports({ key: 123 })).toBe(false);
    });
  });

  describe('name property', () => {
    it('should have correct name', () => {
      expect(extractor.name).toBe('localStorage');
    });
  });
});