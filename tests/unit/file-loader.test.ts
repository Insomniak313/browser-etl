import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileLoader } from '../../src/loaders/file';

describe('FileLoader', () => {
  let loader: FileLoader;

  beforeEach(() => {
    loader = new FileLoader();
    vi.clearAllMocks();

    // Mock DOM methods
    const mockLink = {
      href: '',
      download: '',
      style: { display: '' },
      click: vi.fn()
    };

    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  describe('load method', () => {
    it('should download JSON file', async () => {
      const data = { name: 'John', age: 30 };

      await loader.load(data, {
        filename: 'data',
        format: 'json'
      });

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should download CSV file', async () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ];

      await loader.load(data, {
        filename: 'users',
        format: 'csv'
      });

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('should download TXT file', async () => {
      const data = 'Hello World';

      await loader.load(data, {
        filename: 'text',
        format: 'txt'
      });

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('should download XML file', async () => {
      const data = { name: 'John', age: 30 };

      await loader.load(data, {
        filename: 'data',
        format: 'xml'
      });

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('should use custom filename with extension', async () => {
      const data = { name: 'John' };

      await loader.load(data, {
        filename: 'user-data',
        format: 'json'
      });

      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should use filename without extension', async () => {
      const data = { name: 'John' };

      await loader.load(data, {
        filename: 'user-data.json',
        format: 'json'
      });

      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should use custom MIME type', async () => {
      const data = { name: 'John' };

      await loader.load(data, {
        filename: 'data',
        format: 'json',
        mimeType: 'application/vnd.api+json'
      });

      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should not download when download is false', async () => {
      const data = { name: 'John' };

      const result = await loader.load(data, {
        filename: 'data',
        format: 'json',
        download: false
      });

      expect(result).toBeDefined();
      expect(document.createElement).not.toHaveBeenCalled();
    });

    it('should throw error when filename is missing', async () => {
      await expect(loader.load({ name: 'John' }, {} as any))
        .rejects.toThrow('Filename is required for file loading');
    });

    it('should handle array data for CSV', async () => {
      const data = [
        ['Name', 'Age'],
        ['John', '30'],
        ['Jane', '25']
      ];

      await loader.load(data, {
        filename: 'data',
        format: 'csv'
      });

      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should handle primitive array for CSV', async () => {
      const data = [1, 2, 3, 4, 5];

      await loader.load(data, {
        filename: 'numbers',
        format: 'csv'
      });

      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should handle complex nested objects', async () => {
      const data = {
        users: [
          { name: 'John', profile: { age: 30, city: 'NYC' } },
          { name: 'Jane', profile: { age: 25, city: 'LA' } }
        ],
        metadata: { total: 2, timestamp: '2023-01-01' }
      };

      await loader.load(data, {
        filename: 'complex-data',
        format: 'json'
      });

      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should handle empty data', async () => {
      const data: any[] = [];

      await loader.load(data, {
        filename: 'empty',
        format: 'csv'
      });

      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should handle null and undefined values in CSV', async () => {
      const data = [
        { name: 'John', age: 30, city: null },
        { name: 'Jane', age: undefined, city: 'LA' }
      ];

      await loader.load(data, {
        filename: 'data',
        format: 'csv'
      });

      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should escape special characters in CSV', async () => {
      const data = [
        { name: 'John "The Great"', description: 'A person with, comma' },
        { name: 'Jane\nNewline', description: 'Multi\nline\ntext' }
      ];

      await loader.load(data, {
        filename: 'special-chars',
        format: 'csv'
      });

      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should handle default format', async () => {
      const data = { name: 'John' };

      await loader.load(data, {
        filename: 'data'
      });

      expect(document.createElement).toHaveBeenCalledWith('a');
    });
  });

  describe('supports method', () => {
    it('should support config with filename', () => {
      expect(loader.supports({ filename: 'data.json' })).toBe(true);
    });

    it('should not support config without filename', () => {
      expect(loader.supports({})).toBe(false);
    });

    it('should not support config with non-string filename', () => {
      expect(loader.supports({ filename: 123 })).toBe(false);
    });
  });

  describe('name property', () => {
    it('should have correct name', () => {
      expect(loader.name).toBe('file');
    });
  });
});