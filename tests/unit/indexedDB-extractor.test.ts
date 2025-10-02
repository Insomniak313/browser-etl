import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IndexedDBExtractor } from '../../src/extractors/indexedDB';

describe('IndexedDBExtractor', () => {
  let extractor: IndexedDBExtractor;
  let mockIndexedDB: any;
  let mockRequest: any;
  let mockTransaction: any;
  let mockStore: any;
  let mockCursor: any;

  beforeEach(() => {
    extractor = new IndexedDBExtractor();
    vi.clearAllMocks();

    // Mock IndexedDB
    mockCursor = {
      value: { id: 1, name: 'Test' },
      continue: vi.fn()
    };

    mockStore = {
      openCursor: vi.fn(),
      index: vi.fn().mockReturnValue(mockStore)
    };

    mockTransaction = {
      objectStore: vi.fn().mockReturnValue(mockStore)
    };

    mockRequest = {
      result: {
        transaction: vi.fn().mockReturnValue(mockTransaction),
        objectStoreNames: {
          contains: vi.fn().mockReturnValue(true)
        },
        createObjectStore: vi.fn()
      },
      onerror: null,
      onsuccess: null,
      onupgradeneeded: null
    };

    mockIndexedDB = {
      open: vi.fn().mockReturnValue(mockRequest)
    };

    Object.defineProperty(window, 'indexedDB', {
      value: mockIndexedDB,
      writable: true
    });
  });

  describe('extract method', () => {
    it('should extract data from IndexedDB store', async () => {
      const mockCursorRequest = {
        onsuccess: null,
        onerror: null
      };

      mockStore.openCursor.mockReturnValue(mockCursorRequest);

      const extractPromise = extractor.extract({ storeName: 'testStore' });

      // Simulate successful database open
      mockRequest.onsuccess();

      // Simulate successful cursor
      mockCursorRequest.onsuccess({ target: { result: mockCursor } });

      // Simulate cursor completion
      mockCursorRequest.onsuccess({ target: { result: null } });

      const result = await extractPromise;

      expect(mockIndexedDB.open).toHaveBeenCalledWith('browser-etl-db', 1);
      expect(mockTransaction.objectStore).toHaveBeenCalledWith('testStore');
      expect(mockStore.openCursor).toHaveBeenCalledWith(undefined, 'next');
      expect(result).toEqual([{ id: 1, name: 'Test' }]);
    });

    it('should extract data with query', async () => {
      const mockCursorRequest = {
        onsuccess: null,
        onerror: null
      };

      mockStore.openCursor.mockReturnValue(mockCursorRequest);
      const query = { id: 1 };

      const extractPromise = extractor.extract({ 
        storeName: 'testStore', 
        query 
      });

      mockRequest.onsuccess();
      mockCursorRequest.onsuccess({ target: { result: mockCursor } });
      mockCursorRequest.onsuccess({ target: { result: null } });

      await extractPromise;

      expect(mockStore.openCursor).toHaveBeenCalledWith(query, 'next');
    });

    it('should extract data with index', async () => {
      const mockCursorRequest = {
        onsuccess: null,
        onerror: null
      };

      mockStore.openCursor.mockReturnValue(mockCursorRequest);

      const extractPromise = extractor.extract({ 
        storeName: 'testStore', 
        index: 'nameIndex' 
      });

      mockRequest.onsuccess();
      mockCursorRequest.onsuccess({ target: { result: mockCursor } });
      mockCursorRequest.onsuccess({ target: { result: null } });

      await extractPromise;

      expect(mockStore.index).toHaveBeenCalledWith('nameIndex');
    });

    it('should extract data with custom direction', async () => {
      const mockCursorRequest = {
        onsuccess: null,
        onerror: null
      };

      mockStore.openCursor.mockReturnValue(mockCursorRequest);

      const extractPromise = extractor.extract({ 
        storeName: 'testStore', 
        direction: 'prev' 
      });

      mockRequest.onsuccess();
      mockCursorRequest.onsuccess({ target: { result: mockCursor } });
      mockCursorRequest.onsuccess({ target: { result: null } });

      await extractPromise;

      expect(mockStore.openCursor).toHaveBeenCalledWith(undefined, 'prev');
    });

    it('should limit results', async () => {
      const mockCursorRequest = {
        onsuccess: null,
        onerror: null
      };

      mockStore.openCursor.mockReturnValue(mockCursorRequest);

      const extractPromise = extractor.extract({ 
        storeName: 'testStore', 
        limit: 1 
      });

      mockRequest.onsuccess();
      mockCursorRequest.onsuccess({ target: { result: mockCursor } });

      const result = await extractPromise;

      expect(result).toEqual([{ id: 1, name: 'Test' }]);
      expect(mockCursor.continue).not.toHaveBeenCalled();
    });

    it('should handle database open error', async () => {
      const extractPromise = extractor.extract({ storeName: 'testStore' });

      mockRequest.onerror();

      await expect(extractPromise).rejects.toThrow('Failed to open IndexedDB');
    });

    it('should handle cursor error', async () => {
      const mockCursorRequest = {
        onsuccess: null,
        onerror: null
      };

      mockStore.openCursor.mockReturnValue(mockCursorRequest);

      const extractPromise = extractor.extract({ storeName: 'testStore' });

      mockRequest.onsuccess();
      mockCursorRequest.onerror();

      await expect(extractPromise).rejects.toThrow('Failed to read from IndexedDB');
    });

    it('should create object store if needed', async () => {
      const mockCursorRequest = {
        onsuccess: null,
        onerror: null
      };

      mockStore.openCursor.mockReturnValue(mockCursorRequest);
      mockRequest.result.objectStoreNames.contains.mockReturnValue(false);

      const extractPromise = extractor.extract({ storeName: 'testStore' });

      mockRequest.onupgradeneeded();
      mockRequest.onsuccess();
      mockCursorRequest.onsuccess({ target: { result: mockCursor } });
      mockCursorRequest.onsuccess({ target: { result: null } });

      await extractPromise;

      expect(mockRequest.result.createObjectStore).toHaveBeenCalledWith('testStore', {
        keyPath: 'id',
        autoIncrement: true
      });
    });

    it('should throw error when store name is missing', async () => {
      await expect(extractor.extract({} as any))
        .rejects.toThrow('Store name is required for IndexedDB extraction');
    });

    it('should throw error when IndexedDB is not available', async () => {
      Object.defineProperty(window, 'indexedDB', {
        value: undefined,
        writable: true
      });

      await expect(extractor.extract({ storeName: 'testStore' }))
        .rejects.toThrow('IndexedDB is not available in this environment');
    });

    it('should throw error when window is not available', async () => {
      const originalWindow = global.window;
      delete (global as any).window;

      await expect(extractor.extract({ storeName: 'testStore' }))
        .rejects.toThrow('IndexedDB is not available in this environment');

      global.window = originalWindow;
    });
  });

  describe('supports method', () => {
    it('should support config with string storeName', () => {
      expect(extractor.supports({ storeName: 'testStore' })).toBe(true);
    });

    it('should not support config without storeName', () => {
      expect(extractor.supports({})).toBe(false);
    });

    it('should not support config with non-string storeName', () => {
      expect(extractor.supports({ storeName: 123 })).toBe(false);
    });
  });

  describe('name property', () => {
    it('should have correct name', () => {
      expect(extractor.name).toBe('indexedDB');
    });
  });
});