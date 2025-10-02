import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TableLoader } from '../../src/loaders/table';

describe('TableLoader', () => {
  let loader: TableLoader;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    loader = new TableLoader();
    vi.clearAllMocks();

    // Mock DOM elements
    mockContainer = document.createElement('div');
    vi.spyOn(document, 'querySelector').mockReturnValue(mockContainer);
    vi.spyOn(mockContainer, 'appendChild').mockImplementation(() => mockContainer);
  });

  describe('load method', () => {
    it('should create table with array data', async () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ];

      await loader.load(data, {
        container: '#table-container'
      });

      expect(document.querySelector).toHaveBeenCalledWith('#table-container');
      expect(mockContainer.innerHTML).toBe('');
      expect(mockContainer.appendChild).toHaveBeenCalled();
    });

    it('should create table with object data', async () => {
      const data = { name: 'John', age: 30 };

      await loader.load(data, {
        container: '#table-container'
      });

      expect(mockContainer.appendChild).toHaveBeenCalled();
    });

    it('should create table with primitive data', async () => {
      const data = 'Hello World';

      await loader.load(data, {
        container: '#table-container'
      });

      expect(mockContainer.appendChild).toHaveBeenCalled();
    });

    it('should use HTMLElement container', async () => {
      const container = document.createElement('div');
      vi.spyOn(container, 'appendChild').mockImplementation(() => container);

      await loader.load([{ name: 'John' }], {
        container
      });

      expect(container.appendChild).toHaveBeenCalled();
    });

    it('should create sortable table', async () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ];

      await loader.load(data, {
        container: '#table-container',
        sortable: true
      });

      expect(mockContainer.appendChild).toHaveBeenCalled();
    });

    it('should create searchable table', async () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ];

      await loader.load(data, {
        container: '#table-container',
        searchable: true
      });

      expect(mockContainer.appendChild).toHaveBeenCalled();
    });

    it('should create paginated table', async () => {
      const data = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `User ${i + 1}` }));

      await loader.load(data, {
        container: '#table-container',
        pagination: true,
        pageSize: 10
      });

      expect(mockContainer.appendChild).toHaveBeenCalled();
    });

    it('should use custom headers', async () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ];

      await loader.load(data, {
        container: '#table-container',
        headers: ['Name', 'Age']
      });

      expect(mockContainer.appendChild).toHaveBeenCalled();
    });

    it('should use custom className', async () => {
      const data = [{ name: 'John' }];

      await loader.load(data, {
        container: '#table-container',
        className: 'custom-table'
      });

      expect(mockContainer.appendChild).toHaveBeenCalled();
    });

    it('should use custom style', async () => {
      const data = [{ name: 'John' }];

      await loader.load(data, {
        container: '#table-container',
        style: { border: '1px solid red' }
      });

      expect(mockContainer.appendChild).toHaveBeenCalled();
    });

    it('should throw error when container is missing', async () => {
      await expect(loader.load([{ name: 'John' }], {} as any))
        .rejects.toThrow('Container is required for table loading');
    });

    it('should throw error when container element not found', async () => {
      vi.spyOn(document, 'querySelector').mockReturnValue(null);

      await expect(loader.load([{ name: 'John' }], {
        container: '#non-existent'
      })).rejects.toThrow('Container element \'#non-existent\' not found');
    });

    it('should handle empty data', async () => {
      const data: any[] = [];

      await loader.load(data, {
        container: '#table-container'
      });

      expect(mockContainer.appendChild).toHaveBeenCalled();
    });

    it('should handle mixed data types', async () => {
      const data = [
        { name: 'John', age: 30 },
        'String item',
        42,
        { complex: { nested: 'value' } }
      ];

      await loader.load(data, {
        container: '#table-container'
      });

      expect(mockContainer.appendChild).toHaveBeenCalled();
    });

    it('should create table with all features enabled', async () => {
      const data = Array.from({ length: 15 }, (_, i) => ({ 
        id: i + 1, 
        name: `User ${i + 1}`, 
        age: 20 + i 
      }));

      await loader.load(data, {
        container: '#table-container',
        headers: ['ID', 'Name', 'Age'],
        sortable: true,
        searchable: true,
        pagination: true,
        pageSize: 5,
        className: 'feature-rich-table',
        style: { border: '2px solid blue' }
      });

      expect(mockContainer.appendChild).toHaveBeenCalled();
    });
  });

  describe('supports method', () => {
    it('should support config with container', () => {
      expect(loader.supports({ container: '#table' })).toBe(true);
    });

    it('should support config with HTMLElement container', () => {
      const element = document.createElement('div');
      expect(loader.supports({ container: element })).toBe(true);
    });

    it('should not support config without container', () => {
      expect(loader.supports({})).toBe(false);
    });
  });

  describe('name property', () => {
    it('should have correct name', () => {
      expect(loader.name).toBe('table');
    });
  });
});