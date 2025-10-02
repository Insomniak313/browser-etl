import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PluginManager } from '../../src/plugins/plugin-manager';
import { IPlugin, IExtractor, ITransformer, ILoader } from '../../src/types';

describe('PluginManager', () => {
  let pluginManager: PluginManager;
  let mockPlugin: IPlugin;
  let mockExtractor: IExtractor;
  let mockTransformer: ITransformer;
  let mockLoader: ILoader;

  beforeEach(() => {
    pluginManager = new PluginManager();
    vi.clearAllMocks();

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

    mockPlugin = {
      name: 'test-plugin',
      version: '1.0.0',
      initialize: vi.fn().mockResolvedValue(undefined),
      cleanup: vi.fn().mockResolvedValue(undefined),
      getExtractors: vi.fn().mockReturnValue([mockExtractor]),
      getTransformers: vi.fn().mockReturnValue([mockTransformer]),
      getLoaders: vi.fn().mockReturnValue([mockLoader])
    };
  });

  describe('registerPlugin', () => {
    it('should register plugin successfully', async () => {
      await pluginManager.registerPlugin(mockPlugin);

      expect(mockPlugin.initialize).toHaveBeenCalled();
      expect(pluginManager.hasPlugin('test-plugin')).toBe(true);
      expect(pluginManager.getPlugin('test-plugin')).toBe(mockPlugin);
    });

    it('should register plugin components', async () => {
      await pluginManager.registerPlugin(mockPlugin);

      expect(pluginManager.getExtractor('test-extractor')).toBe(mockExtractor);
      expect(pluginManager.getTransformer('test-transformer')).toBe(mockTransformer);
      expect(pluginManager.getLoader('test-loader')).toBe(mockLoader);
    });

    it('should throw error when plugin already registered', async () => {
      await pluginManager.registerPlugin(mockPlugin);

      await expect(pluginManager.registerPlugin(mockPlugin))
        .rejects.toThrow('Plugin \'test-plugin\' is already registered');
    });

    it('should throw error when plugin initialization fails', async () => {
      mockPlugin.initialize.mockRejectedValue(new Error('Initialization failed'));

      await expect(pluginManager.registerPlugin(mockPlugin))
        .rejects.toThrow('Failed to initialize plugin \'test-plugin\': Error: Initialization failed');
    });

    it('should register plugin with multiple components', async () => {
      const additionalExtractor = {
        name: 'additional-extractor',
        extract: vi.fn().mockResolvedValue('additional-data'),
        supports: vi.fn().mockReturnValue(true)
      };

      const additionalTransformer = {
        name: 'additional-transformer',
        transform: vi.fn().mockResolvedValue('additional-transformed'),
        supports: vi.fn().mockReturnValue(true)
      };

      mockPlugin.getExtractors.mockReturnValue([mockExtractor, additionalExtractor]);
      mockPlugin.getTransformers.mockReturnValue([mockTransformer, additionalTransformer]);

      await pluginManager.registerPlugin(mockPlugin);

      expect(pluginManager.getExtractor('test-extractor')).toBe(mockExtractor);
      expect(pluginManager.getExtractor('additional-extractor')).toBe(additionalExtractor);
      expect(pluginManager.getTransformer('test-transformer')).toBe(mockTransformer);
      expect(pluginManager.getTransformer('additional-transformer')).toBe(additionalTransformer);
    });

    it('should register plugin with no components', async () => {
      mockPlugin.getExtractors.mockReturnValue([]);
      mockPlugin.getTransformers.mockReturnValue([]);
      mockPlugin.getLoaders.mockReturnValue([]);

      await pluginManager.registerPlugin(mockPlugin);

      expect(pluginManager.hasPlugin('test-plugin')).toBe(true);
      expect(pluginManager.getExtractors().size).toBe(0);
      expect(pluginManager.getTransformers().size).toBe(0);
      expect(pluginManager.getLoaders().size).toBe(0);
    });
  });

  describe('unregisterPlugin', () => {
    beforeEach(async () => {
      await pluginManager.registerPlugin(mockPlugin);
    });

    it('should unregister plugin successfully', async () => {
      await pluginManager.unregisterPlugin('test-plugin');

      expect(mockPlugin.cleanup).toHaveBeenCalled();
      expect(pluginManager.hasPlugin('test-plugin')).toBe(false);
      expect(pluginManager.getPlugin('test-plugin')).toBeUndefined();
    });

    it('should remove plugin components', async () => {
      await pluginManager.unregisterPlugin('test-plugin');

      expect(pluginManager.getExtractor('test-extractor')).toBeUndefined();
      expect(pluginManager.getTransformer('test-transformer')).toBeUndefined();
      expect(pluginManager.getLoader('test-loader')).toBeUndefined();
    });

    it('should throw error when plugin not registered', async () => {
      await expect(pluginManager.unregisterPlugin('non-existent-plugin'))
        .rejects.toThrow('Plugin \'non-existent-plugin\' is not registered');
    });

    it('should throw error when plugin cleanup fails', async () => {
      mockPlugin.cleanup.mockRejectedValue(new Error('Cleanup failed'));

      await expect(pluginManager.unregisterPlugin('test-plugin'))
        .rejects.toThrow('Failed to cleanup plugin \'test-plugin\': Error: Cleanup failed');
    });
  });

  describe('getPlugins', () => {
    it('should return empty array when no plugins registered', () => {
      expect(pluginManager.getPlugins()).toEqual([]);
    });

    it('should return all registered plugins', async () => {
      const plugin2 = {
        ...mockPlugin,
        name: 'test-plugin-2',
        initialize: vi.fn().mockResolvedValue(undefined),
        cleanup: vi.fn().mockResolvedValue(undefined),
        getExtractors: vi.fn().mockReturnValue([]),
        getTransformers: vi.fn().mockReturnValue([]),
        getLoaders: vi.fn().mockReturnValue([])
      };

      await pluginManager.registerPlugin(mockPlugin);
      await pluginManager.registerPlugin(plugin2);

      const plugins = pluginManager.getPlugins();
      expect(plugins).toHaveLength(2);
      expect(plugins).toContain(mockPlugin);
      expect(plugins).toContain(plugin2);
    });
  });

  describe('getPlugin', () => {
    it('should return undefined for non-existent plugin', () => {
      expect(pluginManager.getPlugin('non-existent')).toBeUndefined();
    });

    it('should return registered plugin', async () => {
      await pluginManager.registerPlugin(mockPlugin);

      expect(pluginManager.getPlugin('test-plugin')).toBe(mockPlugin);
    });
  });

  describe('getExtractors', () => {
    it('should return empty map when no extractors registered', () => {
      const extractors = pluginManager.getExtractors();
      expect(extractors.size).toBe(0);
    });

    it('should return copy of extractors map', async () => {
      await pluginManager.registerPlugin(mockPlugin);

      const extractors = pluginManager.getExtractors();
      expect(extractors.size).toBe(1);
      expect(extractors.get('test-extractor')).toBe(mockExtractor);

      // Modifying the returned map should not affect the internal map
      extractors.delete('test-extractor');
      expect(pluginManager.getExtractor('test-extractor')).toBe(mockExtractor);
    });
  });

  describe('getTransformers', () => {
    it('should return empty map when no transformers registered', () => {
      const transformers = pluginManager.getTransformers();
      expect(transformers.size).toBe(0);
    });

    it('should return copy of transformers map', async () => {
      await pluginManager.registerPlugin(mockPlugin);

      const transformers = pluginManager.getTransformers();
      expect(transformers.size).toBe(1);
      expect(transformers.get('test-transformer')).toBe(mockTransformer);

      // Modifying the returned map should not affect the internal map
      transformers.delete('test-transformer');
      expect(pluginManager.getTransformer('test-transformer')).toBe(mockTransformer);
    });
  });

  describe('getLoaders', () => {
    it('should return empty map when no loaders registered', () => {
      const loaders = pluginManager.getLoaders();
      expect(loaders.size).toBe(0);
    });

    it('should return copy of loaders map', async () => {
      await pluginManager.registerPlugin(mockPlugin);

      const loaders = pluginManager.getLoaders();
      expect(loaders.size).toBe(1);
      expect(loaders.get('test-loader')).toBe(mockLoader);

      // Modifying the returned map should not affect the internal map
      loaders.delete('test-loader');
      expect(pluginManager.getLoader('test-loader')).toBe(mockLoader);
    });
  });

  describe('getExtractor', () => {
    it('should return undefined for non-existent extractor', () => {
      expect(pluginManager.getExtractor('non-existent')).toBeUndefined();
    });

    it('should return registered extractor', async () => {
      await pluginManager.registerPlugin(mockPlugin);

      expect(pluginManager.getExtractor('test-extractor')).toBe(mockExtractor);
    });
  });

  describe('getTransformer', () => {
    it('should return undefined for non-existent transformer', () => {
      expect(pluginManager.getTransformer('non-existent')).toBeUndefined();
    });

    it('should return registered transformer', async () => {
      await pluginManager.registerPlugin(mockPlugin);

      expect(pluginManager.getTransformer('test-transformer')).toBe(mockTransformer);
    });
  });

  describe('getLoader', () => {
    it('should return undefined for non-existent loader', () => {
      expect(pluginManager.getLoader('non-existent')).toBeUndefined();
    });

    it('should return registered loader', async () => {
      await pluginManager.registerPlugin(mockPlugin);

      expect(pluginManager.getLoader('test-loader')).toBe(mockLoader);
    });
  });

  describe('hasPlugin', () => {
    it('should return false for non-existent plugin', () => {
      expect(pluginManager.hasPlugin('non-existent')).toBe(false);
    });

    it('should return true for registered plugin', async () => {
      await pluginManager.registerPlugin(mockPlugin);

      expect(pluginManager.hasPlugin('test-plugin')).toBe(true);
    });
  });

  describe('clearAll', () => {
    it('should clear all plugins', async () => {
      const plugin2 = {
        ...mockPlugin,
        name: 'test-plugin-2',
        initialize: vi.fn().mockResolvedValue(undefined),
        cleanup: vi.fn().mockResolvedValue(undefined),
        getExtractors: vi.fn().mockReturnValue([]),
        getTransformers: vi.fn().mockReturnValue([]),
        getLoaders: vi.fn().mockReturnValue([])
      };

      await pluginManager.registerPlugin(mockPlugin);
      await pluginManager.registerPlugin(plugin2);

      expect(pluginManager.getPlugins()).toHaveLength(2);

      await pluginManager.clearAll();

      expect(pluginManager.getPlugins()).toHaveLength(0);
      expect(pluginManager.getExtractors().size).toBe(0);
      expect(pluginManager.getTransformers().size).toBe(0);
      expect(pluginManager.getLoaders().size).toBe(0);
    });

    it('should handle cleanup errors gracefully', async () => {
      mockPlugin.cleanup.mockRejectedValue(new Error('Cleanup failed'));

      await pluginManager.registerPlugin(mockPlugin);

      await expect(pluginManager.clearAll())
        .rejects.toThrow('Failed to cleanup plugin \'test-plugin\': Error: Cleanup failed');
    });

    it('should work when no plugins registered', async () => {
      await expect(pluginManager.clearAll()).resolves.not.toThrow();
    });
  });

  describe('component name conflicts', () => {
    it('should handle extractor name conflicts', async () => {
      const plugin1 = {
        ...mockPlugin,
        name: 'plugin-1',
        getExtractors: vi.fn().mockReturnValue([mockExtractor]),
        getTransformers: vi.fn().mockReturnValue([]),
        getLoaders: vi.fn().mockReturnValue([])
      };

      const plugin2 = {
        ...mockPlugin,
        name: 'plugin-2',
        getExtractors: vi.fn().mockReturnValue([mockExtractor]), // Same name
        getTransformers: vi.fn().mockReturnValue([]),
        getLoaders: vi.fn().mockReturnValue([])
      };

      await pluginManager.registerPlugin(plugin1);
      await pluginManager.registerPlugin(plugin2);

      // Second plugin should override the first
      expect(pluginManager.getExtractor('test-extractor')).toBe(mockExtractor);
    });

    it('should handle transformer name conflicts', async () => {
      const plugin1 = {
        ...mockPlugin,
        name: 'plugin-1',
        getExtractors: vi.fn().mockReturnValue([]),
        getTransformers: vi.fn().mockReturnValue([mockTransformer]),
        getLoaders: vi.fn().mockReturnValue([])
      };

      const plugin2 = {
        ...mockPlugin,
        name: 'plugin-2',
        getExtractors: vi.fn().mockReturnValue([]),
        getTransformers: vi.fn().mockReturnValue([mockTransformer]), // Same name
        getLoaders: vi.fn().mockReturnValue([])
      };

      await pluginManager.registerPlugin(plugin1);
      await pluginManager.registerPlugin(plugin2);

      // Second plugin should override the first
      expect(pluginManager.getTransformer('test-transformer')).toBe(mockTransformer);
    });

    it('should handle loader name conflicts', async () => {
      const plugin1 = {
        ...mockPlugin,
        name: 'plugin-1',
        getExtractors: vi.fn().mockReturnValue([]),
        getTransformers: vi.fn().mockReturnValue([]),
        getLoaders: vi.fn().mockReturnValue([mockLoader])
      };

      const plugin2 = {
        ...mockPlugin,
        name: 'plugin-2',
        getExtractors: vi.fn().mockReturnValue([]),
        getTransformers: vi.fn().mockReturnValue([]),
        getLoaders: vi.fn().mockReturnValue([mockLoader]) // Same name
      };

      await pluginManager.registerPlugin(plugin1);
      await pluginManager.registerPlugin(plugin2);

      // Second plugin should override the first
      expect(pluginManager.getLoader('test-loader')).toBe(mockLoader);
    });
  });
});