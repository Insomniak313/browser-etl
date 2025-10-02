import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileExtractor } from '../../src/extractors/file';

describe('FileExtractor', () => {
  let extractor: FileExtractor;

  beforeEach(() => {
    extractor = new FileExtractor();
  });

  describe('extract method', () => {
    it('should extract text from file', async () => {
      const fileContent = 'Hello World';
      const mockFile = new File([fileContent], 'test.txt', { type: 'text/plain' });

      const mockFileReader = {
        readAsText: vi.fn(),
        result: fileContent,
        onload: null as any,
        onerror: null as any
      };

      global.FileReader = vi.fn().mockImplementation(() => mockFileReader);

      const result = await extractor.extract({ file: mockFile });

      expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile, 'utf-8');
      
      // Simulate successful file read
      mockFileReader.onload();
      
      expect(result).toBe(fileContent);
    });

    it('should extract JSON from file', async () => {
      const jsonContent = '{"name":"John","age":30}';
      const mockFile = new File([jsonContent], 'test.json', { type: 'application/json' });

      const mockFileReader = {
        readAsText: vi.fn(),
        result: jsonContent,
        onload: null as any,
        onerror: null as any
      };

      global.FileReader = vi.fn().mockImplementation(() => mockFileReader);

      const result = await extractor.extract({ file: mockFile, type: 'json' });

      mockFileReader.onload();
      
      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('should extract CSV from file', async () => {
      const csvContent = 'name,age\nJohn,30\nJane,25';
      const mockFile = new File([csvContent], 'test.csv', { type: 'text/csv' });

      const mockFileReader = {
        readAsText: vi.fn(),
        result: csvContent,
        onload: null as any,
        onerror: null as any
      };

      global.FileReader = vi.fn().mockImplementation(() => mockFileReader);

      const result = await extractor.extract({ file: mockFile, type: 'csv' });

      mockFileReader.onload();
      
      expect(result).toEqual([
        ['name', 'age'],
        ['John', '30'],
        ['Jane', '25']
      ]);
    });

    it('should extract binary data from file', async () => {
      const binaryData = new ArrayBuffer(8);
      const mockFile = new File([binaryData], 'test.bin', { type: 'application/octet-stream' });

      const mockFileReader = {
        readAsArrayBuffer: vi.fn(),
        result: binaryData,
        onload: null as any,
        onerror: null as any
      };

      global.FileReader = vi.fn().mockImplementation(() => mockFileReader);

      const result = await extractor.extract({ file: mockFile, type: 'binary' });

      expect(mockFileReader.readAsArrayBuffer).toHaveBeenCalledWith(mockFile);
      
      // Simulate successful file read
      mockFileReader.onload();
      
      expect(result).toBe(binaryData);
    });

    it('should use custom encoding', async () => {
      const fileContent = 'Hello World';
      const mockFile = new File([fileContent], 'test.txt', { type: 'text/plain' });

      const mockFileReader = {
        readAsText: vi.fn(),
        result: fileContent,
        onload: null as any,
        onerror: null as any
      };

      global.FileReader = vi.fn().mockImplementation(() => mockFileReader);

      const result = await extractor.extract({ 
        file: mockFile, 
        type: 'text', 
        encoding: 'iso-8859-1' 
      });

      expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile, 'iso-8859-1');
      
      mockFileReader.onload();
      expect(result).toBe(fileContent);
    });

    it('should handle text read error', async () => {
      const mockFile = new File([''], 'test.txt', { type: 'text/plain' });

      const mockFileReader = {
        readAsText: vi.fn(),
        onload: null as any,
        onerror: null as any
      };

      global.FileReader = vi.fn().mockImplementation(() => mockFileReader);

      const extractPromise = extractor.extract({ file: mockFile });

      // Simulate file read error
      mockFileReader.onerror();

      await expect(extractPromise).rejects.toThrow('Failed to read file as text');
    });

    it('should handle JSON parse error', async () => {
      const invalidJson = 'invalid json';
      const mockFile = new File([invalidJson], 'test.json', { type: 'application/json' });

      const mockFileReader = {
        readAsText: vi.fn(),
        result: invalidJson,
        onload: null as any,
        onerror: null as any
      };

      global.FileReader = vi.fn().mockImplementation(() => mockFileReader);

      const extractPromise = extractor.extract({ file: mockFile, type: 'json' });

      mockFileReader.onload();

      await expect(extractPromise).rejects.toThrow('Failed to parse file as JSON');
    });

    it('should handle binary read error', async () => {
      const mockFile = new File([''], 'test.bin', { type: 'application/octet-stream' });

      const mockFileReader = {
        readAsArrayBuffer: vi.fn(),
        onload: null as any,
        onerror: null as any
      };

      global.FileReader = vi.fn().mockImplementation(() => mockFileReader);

      const extractPromise = extractor.extract({ file: mockFile, type: 'binary' });

      // Simulate file read error
      mockFileReader.onerror();

      await expect(extractPromise).rejects.toThrow('Failed to read file as binary');
    });

    it('should throw error for unsupported file type', async () => {
      const mockFile = new File([''], 'test.xyz', { type: 'application/xyz' });

      await expect(extractor.extract({ file: mockFile, type: 'xyz' as any }))
        .rejects.toThrow('Unsupported file type: xyz');
    });

    it('should throw error when file is missing', async () => {
      await expect(extractor.extract({} as any))
        .rejects.toThrow('File is required for file extraction');
    });
  });

  describe('supports method', () => {
    it('should support config with File', () => {
      const file = new File([''], 'test.txt');
      expect(extractor.supports({ file })).toBe(true);
    });

    it('should not support config without file', () => {
      expect(extractor.supports({})).toBe(false);
    });

    it('should not support config with non-File', () => {
      expect(extractor.supports({ file: 'not-a-file' })).toBe(false);
    });
  });

  describe('name property', () => {
    it('should have correct name', () => {
      expect(extractor.name).toBe('file');
    });
  });
});