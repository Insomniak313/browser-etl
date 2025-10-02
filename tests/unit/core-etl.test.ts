import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ETL, etl } from '../../src/core/etl';
import { ETLPipeline } from '../../src/core/pipeline';

// Mock the pipeline
vi.mock('../../src/core/pipeline');

describe('ETL', () => {
  let mockPipeline: any;
  let etlInstance: ETL;

  beforeEach(() => {
    mockPipeline = {
      registerExtractor: vi.fn().mockReturnThis(),
      registerTransformer: vi.fn().mockReturnThis(),
      registerLoader: vi.fn().mockReturnThis(),
      extract: vi.fn(),
      transform: vi.fn(),
      load: vi.fn(),
      run: vi.fn().mockResolvedValue({ success: true, data: 'test-data' })
    };

    (ETLPipeline as any).mockImplementation(() => mockPipeline);
    etlInstance = new ETL();
  });

  describe('constructor', () => {
    it('should create ETL instance with default config', () => {
      expect(ETLPipeline).toHaveBeenCalledWith(undefined);
      expect(mockPipeline.registerExtractor).toHaveBeenCalledTimes(6); // 6 extractors
      expect(mockPipeline.registerTransformer).toHaveBeenCalledTimes(4); // 4 transformers
      expect(mockPipeline.registerLoader).toHaveBeenCalledTimes(4); // 4 loaders
    });

    it('should create ETL instance with custom config', () => {
      const config = { enableCache: true };
      new ETL(config);
      expect(ETLPipeline).toHaveBeenCalledWith(config);
    });
  });

  describe('extract methods', () => {
    it('should extract from API', () => {
      etlInstance.extract.api('https://api.example.com', { method: 'GET' });
      expect(mockPipeline.extract).toHaveBeenCalledWith('api', {
        url: 'https://api.example.com',
        options: { method: 'GET' }
      });
    });

    it('should extract HTML', () => {
      etlInstance.extract.html('.selector', 'https://example.com');
      expect(mockPipeline.extract).toHaveBeenCalledWith('html', {
        selector: '.selector',
        url: 'https://example.com'
      });
    });

    it('should extract CSV', () => {
      const csvData = 'name,age\nJohn,30';
      etlInstance.extract.csv(csvData, { delimiter: ',' });
      expect(mockPipeline.extract).toHaveBeenCalledWith('csv', {
        data: csvData,
        options: { delimiter: ',' }
      });
    });

    it('should extract from localStorage', () => {
      etlInstance.extract.localStorage('myKey');
      expect(mockPipeline.extract).toHaveBeenCalledWith('localStorage', {
        key: 'myKey'
      });
    });

    it('should extract from IndexedDB', () => {
      etlInstance.extract.indexedDB('myStore', { id: 1 });
      expect(mockPipeline.extract).toHaveBeenCalledWith('indexedDB', {
        storeName: 'myStore',
        query: { id: 1 }
      });
    });

    it('should extract from file', () => {
      const file = new File(['test'], 'test.txt');
      etlInstance.extract.file(file, 'text');
      expect(mockPipeline.extract).toHaveBeenCalledWith('file', {
        file,
        type: 'text'
      });
    });
  });

  describe('transform methods', () => {
    it('should transform data with function', () => {
      const transformFn = (data: any) => data * 2;
      etlInstance.transform(transformFn);
      expect(mockPipeline.transform).toHaveBeenCalledWith('map', { fn: transformFn });
    });

    it('should join with API', () => {
      etlInstance.join.api('https://api.example.com', { key: 'id' });
      expect(mockPipeline.transform).toHaveBeenCalledWith('join', {
        type: 'api',
        url: 'https://api.example.com',
        config: { key: 'id' }
      });
    });

    it('should join with data', () => {
      const joinData = [{ id: 1, name: 'John' }];
      etlInstance.join.data(joinData, { key: 'id' });
      expect(mockPipeline.transform).toHaveBeenCalledWith('join', {
        type: 'data',
        data: joinData,
        config: { key: 'id' }
      });
    });

    it('should filter data', () => {
      const filterFn = (item: any) => item.active;
      etlInstance.filter(filterFn);
      expect(mockPipeline.transform).toHaveBeenCalledWith('filter', { fn: filterFn });
    });

    it('should map data', () => {
      const mapFn = (item: any) => ({ ...item, processed: true });
      etlInstance.map(mapFn);
      expect(mockPipeline.transform).toHaveBeenCalledWith('map', { fn: mapFn });
    });

    it('should enrich data', async () => {
      const enrichFn = async (item: any) => ({ ...item, enriched: true });
      etlInstance.enrich(enrichFn);
      expect(mockPipeline.transform).toHaveBeenCalledWith('enrich', { fn: enrichFn });
    });
  });

  describe('load methods', () => {
    it('should load to chart', () => {
      etlInstance.load.chart('bar', { responsive: true });
      expect(mockPipeline.load).toHaveBeenCalledWith('chart', {
        type: 'bar',
        config: { responsive: true }
      });
    });

    it('should load to table', () => {
      const container = document.createElement('div');
      etlInstance.load.table(container, { sortable: true });
      expect(mockPipeline.load).toHaveBeenCalledWith('table', {
        container,
        config: { sortable: true }
      });
    });

    it('should load to table with string selector', () => {
      etlInstance.load.table('#myTable');
      expect(mockPipeline.load).toHaveBeenCalledWith('table', {
        container: '#myTable',
        config: undefined
      });
    });

    it('should load to file', () => {
      etlInstance.load.file('output.csv', 'csv');
      expect(mockPipeline.load).toHaveBeenCalledWith('file', {
        filename: 'output.csv',
        format: 'csv'
      });
    });

    it('should load to API', () => {
      etlInstance.load.api('https://api.example.com', { method: 'POST' });
      expect(mockPipeline.load).toHaveBeenCalledWith('api', {
        url: 'https://api.example.com',
        options: { method: 'POST' }
      });
    });
  });

  describe('run method', () => {
    it('should run pipeline successfully', async () => {
      const result = await etlInstance.run();
      expect(mockPipeline.run).toHaveBeenCalled();
      expect(result).toBe('test-data');
    });

    it('should throw error when pipeline fails', async () => {
      const error = new Error('Pipeline failed');
      mockPipeline.run.mockResolvedValue({ success: false, error });
      
      await expect(etlInstance.run()).rejects.toThrow('Pipeline failed');
    });
  });

  describe('getPipeline method', () => {
    it('should return the underlying pipeline', () => {
      const pipeline = etlInstance.getPipeline();
      expect(pipeline).toBe(mockPipeline);
    });
  });

  describe('fluent API', () => {
    it('should support method chaining', () => {
      const result = etlInstance
        .extract.api('https://api.example.com')
        .filter((item: any) => item.active)
        .map((item: any) => ({ ...item, processed: true }))
        .load.table('#myTable');

      expect(result).toBe(etlInstance);
      expect(mockPipeline.extract).toHaveBeenCalled();
      expect(mockPipeline.transform).toHaveBeenCalledTimes(2);
      expect(mockPipeline.load).toHaveBeenCalled();
    });
  });
});

describe('etl function', () => {
  it('should create new ETL instance', () => {
    const config = { enableCache: true };
    const instance = etl(config);
    expect(instance).toBeInstanceOf(ETL);
  });

  it('should create ETL instance without config', () => {
    const instance = etl();
    expect(instance).toBeInstanceOf(ETL);
  });
});