import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ETLPipeline } from '../../src/core/pipeline';
import { IExtractor, ITransformer, ILoader, ETLConfig } from '../../src/types';

describe('ETLPipeline', () => {
  let pipeline: ETLPipeline;
  let mockExtractor: IExtractor;
  let mockTransformer: ITransformer;
  let mockLoader: ILoader;

  beforeEach(() => {
    pipeline = new ETLPipeline();
    
    mockExtractor = {
      name: 'test-extractor',
      extract: vi.fn().mockResolvedValue('extracted-data'),
      supports: vi.fn().mockReturnValue(true)
    };

    mockTransformer = {
      name: 'test-transformer',
      transform: vi.fn().mockResolvedValue('transformed-data'),
      supports: vi.fn().mockReturnValue(true)
    };

    mockLoader = {
      name: 'test-loader',
      load: vi.fn().mockResolvedValue(undefined),
      supports: vi.fn().mockReturnValue(true)
    };
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const defaultPipeline = new ETLPipeline();
      const config = defaultPipeline.getConfig();
      
      expect(config.enableCache).toBe(true);
      expect(config.cacheDuration).toBe(300000);
      expect(config.enableParallel).toBe(true);
      expect(config.maxParallel).toBe(10);
      expect(config.enableStreaming).toBe(false);
      expect(config.batchSize).toBe(1000);
      expect(config.enableErrorRecovery).toBe(true);
      expect(config.maxRetries).toBe(3);
    });

    it('should initialize with custom config', () => {
      const customConfig: ETLConfig = {
        enableCache: false,
        cacheDuration: 600000,
        enableParallel: false,
        maxParallel: 5
      };
      
      const customPipeline = new ETLPipeline(customConfig);
      const config = customPipeline.getConfig();
      
      expect(config.enableCache).toBe(false);
      expect(config.cacheDuration).toBe(600000);
      expect(config.enableParallel).toBe(false);
      expect(config.maxParallel).toBe(5);
    });
  });

  describe('component registration', () => {
    it('should register extractor', () => {
      const result = pipeline.registerExtractor(mockExtractor);
      expect(result).toBe(pipeline);
    });

    it('should register transformer', () => {
      const result = pipeline.registerTransformer(mockTransformer);
      expect(result).toBe(pipeline);
    });

    it('should register loader', () => {
      const result = pipeline.registerLoader(mockLoader);
      expect(result).toBe(pipeline);
    });

    it('should support method chaining', () => {
      const result = pipeline
        .registerExtractor(mockExtractor)
        .registerTransformer(mockTransformer)
        .registerLoader(mockLoader);
      
      expect(result).toBe(pipeline);
    });
  });

  describe('step addition', () => {
    beforeEach(() => {
      pipeline
        .registerExtractor(mockExtractor)
        .registerTransformer(mockTransformer)
        .registerLoader(mockLoader);
    });

    it('should add extract step', () => {
      const result = pipeline.extract('test-extractor', { url: 'test-url' });
      expect(result).toBe(pipeline);
    });

    it('should add transform step', () => {
      const result = pipeline.transform('test-transformer', { fn: () => {} });
      expect(result).toBe(pipeline);
    });

    it('should add load step', () => {
      const result = pipeline.load('test-loader', { container: '#test' });
      expect(result).toBe(pipeline);
    });

    it('should support method chaining for steps', () => {
      const result = pipeline
        .extract('test-extractor', { url: 'test-url' })
        .transform('test-transformer', { fn: () => {} })
        .load('test-loader', { container: '#test' });
      
      expect(result).toBe(pipeline);
    });
  });

  describe('pipeline execution', () => {
    beforeEach(() => {
      pipeline
        .registerExtractor(mockExtractor)
        .registerTransformer(mockTransformer)
        .registerLoader(mockLoader);
    });

    it('should execute successful pipeline', async () => {
      pipeline
        .extract('test-extractor', { url: 'test-url' })
        .transform('test-transformer', { fn: () => {} })
        .load('test-loader', { container: '#test' });

      const result = await pipeline.run();

      expect(result.success).toBe(true);
      expect(result.data).toBe('transformed-data');
      expect(result.metadata.steps).toHaveLength(3);
      expect(result.metadata.steps.every(step => step.success)).toBe(true);
      expect(mockExtractor.extract).toHaveBeenCalledWith({ url: 'test-url' });
      expect(mockTransformer.transform).toHaveBeenCalledWith('extracted-data', { fn: () => {} });
      expect(mockLoader.load).toHaveBeenCalledWith('transformed-data', { container: '#test' });
    });

    it('should handle extractor not found error', async () => {
      pipeline.extract('non-existent-extractor', {});

      const result = await pipeline.run();

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Extractor \'non-existent-extractor\' not found');
    });

    it('should handle transformer not found error', async () => {
      pipeline
        .extract('test-extractor', {})
        .transform('non-existent-transformer', {});

      const result = await pipeline.run();

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Transformer \'non-existent-transformer\' not found');
    });

    it('should handle loader not found error', async () => {
      pipeline
        .extract('test-extractor', {})
        .load('non-existent-loader', {});

      const result = await pipeline.run();

      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error?.message).toContain('Loader \'non-existent-loader\' not found');
    });

    it('should handle extractor error', async () => {
      const extractorError = new Error('Extraction failed');
      mockExtractor.extract.mockRejectedValueOnce(extractorError);

      pipeline.extract('test-extractor', {});

      const result = await pipeline.run();

      expect(result.success).toBe(false);
      expect(result.error).toBe(extractorError);
    });

    it('should handle transformer error', async () => {
      const transformerError = new Error('Transformation failed');
      mockTransformer.transform.mockRejectedValueOnce(transformerError);

      pipeline
        .extract('test-extractor', {})
        .transform('test-transformer', {});

      const result = await pipeline.run();

      expect(result.success).toBe(false);
      expect(result.error).toBe(transformerError);
    });

    it('should handle loader error', async () => {
      const loaderError = new Error('Loading failed');
      mockLoader.load.mockRejectedValueOnce(loaderError);

      pipeline
        .extract('test-extractor', {})
        .load('test-loader', {});

      const result = await pipeline.run();

      expect(result.success).toBe(false);
      expect(result.error).toBe(loaderError);
    });

    it('should handle optional step failure', async () => {
      const optionalTransformer = {
        name: 'optional-transformer',
        transform: vi.fn().mockRejectedValue(new Error('Optional step failed')),
        supports: vi.fn().mockReturnValue(true)
      };

      pipeline.registerTransformer(optionalTransformer);

      pipeline
        .extract('test-extractor', {})
        .transform('optional-transformer', {})
        .load('test-loader', {});

      const result = await pipeline.run();

      expect(result.success).toBe(true);
      expect(result.metadata.steps[1].success).toBe(false);
      expect(result.metadata.steps[1].error).toContain('Optional step failed');
    });
  });

  describe('caching', () => {
    beforeEach(() => {
      pipeline
        .registerExtractor(mockExtractor)
        .registerTransformer(mockTransformer)
        .registerLoader(mockLoader);
    });

    it('should cache extractor results', async () => {
      pipeline.extract('test-extractor', { url: 'test-url' });

      // First run
      await pipeline.run();
      expect(mockExtractor.extract).toHaveBeenCalledTimes(1);

      // Second run should use cache
      await pipeline.run();
      expect(mockExtractor.extract).toHaveBeenCalledTimes(1);
    });

    it('should not cache when disabled', async () => {
      pipeline.updateConfig({ enableCache: false });
      pipeline.extract('test-extractor', { url: 'test-url' });

      // First run
      await pipeline.run();
      expect(mockExtractor.extract).toHaveBeenCalledTimes(1);

      // Second run should not use cache
      await pipeline.run();
      expect(mockExtractor.extract).toHaveBeenCalledTimes(2);
    });

    it('should clear cache', () => {
      const result = pipeline.clearCache();
      expect(result).toBe(pipeline);
    });
  });

  describe('configuration management', () => {
    it('should get configuration', () => {
      const config = pipeline.getConfig();
      expect(config).toEqual(expect.objectContaining({
        enableCache: true,
        cacheDuration: 300000,
        enableParallel: true,
        maxParallel: 10,
        enableStreaming: false,
        batchSize: 1000,
        enableErrorRecovery: true,
        maxRetries: 3
      }));
    });

    it('should update configuration', () => {
      const newConfig = { enableCache: false, maxParallel: 5 };
      const result = pipeline.updateConfig(newConfig);
      
      expect(result).toBe(pipeline);
      
      const updatedConfig = pipeline.getConfig();
      expect(updatedConfig.enableCache).toBe(false);
      expect(updatedConfig.maxParallel).toBe(5);
      expect(updatedConfig.cacheDuration).toBe(300000); // Should preserve other values
    });
  });

  describe('performance tracking', () => {
    beforeEach(() => {
      pipeline
        .registerExtractor(mockExtractor)
        .registerTransformer(mockTransformer)
        .registerLoader(mockLoader);
    });

    it('should track execution duration', async () => {
      pipeline
        .extract('test-extractor', {})
        .transform('test-transformer', {})
        .load('test-loader', {});

      const result = await pipeline.run();

      expect(result.metadata.duration).toBeGreaterThan(0);
      expect(result.metadata.steps).toHaveLength(3);
      expect(result.metadata.steps.every(step => step.duration >= 0)).toBe(true);
    });

    it('should track cache hits and misses', async () => {
      pipeline.extract('test-extractor', { url: 'test-url' });

      // First run - cache miss
      const result1 = await pipeline.run();
      expect(result1.metadata.cacheMisses).toBe(1);
      expect(result1.metadata.cacheHits).toBe(0);

      // Second run - cache hit
      const result2 = await pipeline.run();
      expect(result2.metadata.cacheMisses).toBe(0);
      expect(result2.metadata.cacheHits).toBe(1);
    });
  });
});