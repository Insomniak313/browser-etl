import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CsvExtractor } from '../../src/extractors/csv';

describe('CsvExtractor', () => {
  let extractor: CsvExtractor;

  beforeEach(() => {
    extractor = new CsvExtractor();
  });

  describe('extract method', () => {
    it('should parse CSV string with headers', async () => {
      const csvData = 'name,age,city\nJohn,30,New York\nJane,25,London';
      const result = await extractor.extract({ data: csvData });

      expect(result).toEqual([
        { name: 'John', age: '30', city: 'New York' },
        { name: 'Jane', age: '25', city: 'London' }
      ]);
    });

    it('should parse CSV string without headers', async () => {
      const csvData = 'John,30,New York\nJane,25,London';
      const result = await extractor.extract({ 
        data: csvData, 
        options: { header: false } 
      });

      expect(result).toEqual([
        ['John', '30', 'New York'],
        ['Jane', '25', 'London']
      ]);
    });

    it('should parse CSV with custom delimiter', async () => {
      const csvData = 'name;age;city\nJohn;30;New York\nJane;25;London';
      const result = await extractor.extract({ 
        data: csvData, 
        options: { delimiter: ';' } 
      });

      expect(result).toEqual([
        { name: 'John', age: '30', city: 'New York' },
        { name: 'Jane', age: '25', city: 'London' }
      ]);
    });

    it('should handle quoted values', async () => {
      const csvData = 'name,description\nJohn,"A person with, comma"\nJane,"Another person"';
      const result = await extractor.extract({ data: csvData });

      expect(result).toEqual([
        { name: 'John', description: 'A person with, comma' },
        { name: 'Jane', description: 'Another person' }
      ]);
    });

    it('should handle escaped quotes', async () => {
      const csvData = 'name,description\nJohn,"A person with ""quotes"""\nJane,"Another person"';
      const result = await extractor.extract({ data: csvData });

      expect(result).toEqual([
        { name: 'John', description: 'A person with "quotes"' },
        { name: 'Jane', description: 'Another person' }
      ]);
    });

    it('should skip empty lines', async () => {
      const csvData = 'name,age\nJohn,30\n\nJane,25\n\n';
      const result = await extractor.extract({ data: csvData });

      expect(result).toEqual([
        { name: 'John', age: '30' },
        { name: 'Jane', age: '25' }
      ]);
    });

    it('should not skip empty lines when disabled', async () => {
      const csvData = 'name,age\nJohn,30\n\nJane,25';
      const result = await extractor.extract({ 
        data: csvData, 
        options: { skipEmptyLines: false } 
      });

      expect(result).toEqual([
        { name: 'John', age: '30' },
        { name: '', age: '' },
        { name: 'Jane', age: '25' }
      ]);
    });

    it('should apply transform function', async () => {
      const csvData = 'name,age\nJohn,30\nJane,25';
      const result = await extractor.extract({ 
        data: csvData, 
        options: { 
          transform: (row: any) => ({ ...row, processed: true })
        } 
      });

      expect(result).toEqual([
        { name: 'John', age: '30', processed: true },
        { name: 'Jane', age: '25', processed: true }
      ]);
    });

    it('should handle File input', async () => {
      const csvContent = 'name,age\nJohn,30\nJane,25';
      const mockFile = new File([csvContent], 'test.csv', { type: 'text/csv' });

      // Mock FileReader
      const mockFileReader = {
        readAsText: vi.fn(),
        result: csvContent,
        onload: null as any,
        onerror: null as any
      };

      global.FileReader = vi.fn().mockImplementation(() => mockFileReader);

      const result = await extractor.extract({ data: mockFile });

      expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile);
      
      // Simulate successful file read
      mockFileReader.onload();
      
      expect(result).toEqual([
        { name: 'John', age: '30' },
        { name: 'Jane', age: '25' }
      ]);
    });

    it('should handle File read error', async () => {
      const mockFile = new File([''], 'test.csv', { type: 'text/csv' });

      const mockFileReader = {
        readAsText: vi.fn(),
        onload: null as any,
        onerror: null as any
      };

      global.FileReader = vi.fn().mockImplementation(() => mockFileReader);

      const extractPromise = extractor.extract({ data: mockFile });

      // Simulate file read error
      mockFileReader.onerror();

      await expect(extractPromise).rejects.toThrow('Failed to read file');
    });

    it('should throw error when data is missing', async () => {
      await expect(extractor.extract({} as any))
        .rejects.toThrow('Data is required for CSV extraction');
    });
  });

  describe('supports method', () => {
    it('should support config with string data', () => {
      expect(extractor.supports({ data: 'test,data' })).toBe(true);
    });

    it('should support config with File data', () => {
      const file = new File([''], 'test.csv');
      expect(extractor.supports({ data: file })).toBe(true);
    });

    it('should not support config without data', () => {
      expect(extractor.supports({})).toBe(false);
    });

    it('should not support config with invalid data type', () => {
      expect(extractor.supports({ data: 123 })).toBe(false);
    });
  });

  describe('name property', () => {
    it('should have correct name', () => {
      expect(extractor.name).toBe('csv');
    });
  });
});