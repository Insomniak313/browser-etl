import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HtmlExtractor } from '../../src/extractors/html';

// Mock fetch
global.fetch = vi.fn();

// Mock DOMParser
global.DOMParser = vi.fn().mockImplementation(() => ({
  parseFromString: vi.fn()
}));

describe('HtmlExtractor', () => {
  let extractor: HtmlExtractor;
  let mockDocument: any;
  let mockElement: any;

  beforeEach(() => {
    extractor = new HtmlExtractor();
    vi.clearAllMocks();

    mockElement = {
      textContent: 'Test Content',
      innerHTML: '<span>Test HTML</span>',
      getAttribute: vi.fn().mockReturnValue('test-attr-value'),
      querySelectorAll: vi.fn()
    };

    mockDocument = {
      querySelectorAll: vi.fn().mockReturnValue([mockElement]),
      createElement: vi.fn()
    };

    // Mock window.document
    Object.defineProperty(window, 'document', {
      value: mockDocument,
      writable: true
    });

    // Mock DOMParser
    (DOMParser as any).mockImplementation(() => ({
      parseFromString: vi.fn().mockReturnValue(mockDocument)
    }));
  });

  describe('extract method', () => {
    it('should extract text content from selector', async () => {
      const result = await extractor.extract({
        selector: '.test-class'
      });

      expect(mockDocument.querySelectorAll).toHaveBeenCalledWith('.test-class');
      expect(result).toBe('Test Content');
    });

    it('should extract HTML content', async () => {
      const result = await extractor.extract({
        selector: '.test-class',
        html: true
      });

      expect(result).toBe('<span>Test HTML</span>');
    });

    it('should extract attribute value', async () => {
      const result = await extractor.extract({
        selector: '.test-class',
        attribute: 'data-value'
      });

      expect(mockElement.getAttribute).toHaveBeenCalledWith('data-value');
      expect(result).toBe('test-attr-value');
    });

    it('should extract multiple elements', async () => {
      const mockElements = [
        { textContent: 'Element 1', innerHTML: '<span>1</span>', getAttribute: vi.fn() },
        { textContent: 'Element 2', innerHTML: '<span>2</span>', getAttribute: vi.fn() }
      ];

      mockDocument.querySelectorAll.mockReturnValue(mockElements);

      const result = await extractor.extract({
        selector: '.multiple',
        multiple: true
      });

      expect(result).toEqual(['Element 1', 'Element 2']);
    });

    it('should return null when no elements found', async () => {
      mockDocument.querySelectorAll.mockReturnValue([]);

      const result = await extractor.extract({
        selector: '.non-existent'
      });

      expect(result).toBeNull();
    });

    it('should return empty array when no elements found and multiple is true', async () => {
      mockDocument.querySelectorAll.mockReturnValue([]);

      const result = await extractor.extract({
        selector: '.non-existent',
        multiple: true
      });

      expect(result).toEqual([]);
    });

    it('should fetch HTML from URL', async () => {
      const mockHtml = '<html><body><div class="test">Content</div></body></html>';
      const mockResponse = {
        ok: true,
        text: () => Promise.resolve(mockHtml)
      };

      (fetch as any).mockResolvedValueOnce(mockResponse);

      const mockUrlDocument = {
        querySelectorAll: vi.fn().mockReturnValue([{ textContent: 'Content' }])
      };

      (DOMParser as any).mockImplementation(() => ({
        parseFromString: vi.fn().mockReturnValue(mockUrlDocument)
      }));

      const result = await extractor.extract({
        selector: '.test',
        url: 'https://example.com'
      });

      expect(fetch).toHaveBeenCalledWith('https://example.com');
      expect(result).toBe('Content');
    });

    it('should handle fetch error', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Not Found'
      };

      (fetch as any).mockResolvedValueOnce(mockResponse);

      await expect(extractor.extract({
        selector: '.test',
        url: 'https://example.com'
      })).rejects.toThrow('Failed to fetch HTML from https://example.com: Not Found');
    });

    it('should throw error when selector is missing', async () => {
      await expect(extractor.extract({} as any))
        .rejects.toThrow('Selector is required for HTML extraction');
    });
  });

  describe('supports method', () => {
    it('should support valid config with selector', () => {
      expect(extractor.supports({ selector: '.test' })).toBe(true);
    });

    it('should not support config without selector', () => {
      expect(extractor.supports({})).toBe(false);
    });

    it('should not support config with non-string selector', () => {
      expect(extractor.supports({ selector: 123 })).toBe(false);
    });
  });

  describe('name property', () => {
    it('should have correct name', () => {
      expect(extractor.name).toBe('html');
    });
  });
});