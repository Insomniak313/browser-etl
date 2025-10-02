import { IPlugin, IExtractor, ITransformer, ILoader } from '../types';

/**
 * Plugin Manager - manages ETL plugins
 */
export class PluginManager {
  private plugins: Map<string, IPlugin> = new Map();
  private extractors: Map<string, IExtractor> = new Map();
  private transformers: Map<string, ITransformer> = new Map();
  private loaders: Map<string, ILoader> = new Map();

  /**
   * Register a plugin
   */
  async registerPlugin(plugin: IPlugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin '${plugin.name}' is already registered`);
    }

    try {
      await plugin.initialize();
      this.plugins.set(plugin.name, plugin);

      // Register plugin components
      plugin.getExtractors().forEach(extractor => {
        this.extractors.set(extractor.name, extractor);
      });

      plugin.getTransformers().forEach(transformer => {
        this.transformers.set(transformer.name, transformer);
      });

      plugin.getLoaders().forEach(loader => {
        this.loaders.set(loader.name, loader);
      });

    } catch (error) {
      throw new Error(`Failed to initialize plugin '${plugin.name}': ${error}`);
    }
  }

  /**
   * Unregister a plugin
   */
  async unregisterPlugin(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin '${pluginName}' is not registered`);
    }

    try {
      await plugin.cleanup();

      // Remove plugin components
      plugin.getExtractors().forEach(extractor => {
        this.extractors.delete(extractor.name);
      });

      plugin.getTransformers().forEach(transformer => {
        this.transformers.delete(transformer.name);
      });

      plugin.getLoaders().forEach(loader => {
        this.loaders.delete(loader.name);
      });

      this.plugins.delete(pluginName);

    } catch (error) {
      throw new Error(`Failed to cleanup plugin '${pluginName}': ${error}`);
    }
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): IPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get a specific plugin
   */
  getPlugin(name: string): IPlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all extractors
   */
  getExtractors(): Map<string, IExtractor> {
    return new Map(this.extractors);
  }

  /**
   * Get all transformers
   */
  getTransformers(): Map<string, ITransformer> {
    return new Map(this.transformers);
  }

  /**
   * Get all loaders
   */
  getLoaders(): Map<string, ILoader> {
    return new Map(this.loaders);
  }

  /**
   * Get a specific extractor
   */
  getExtractor(name: string): IExtractor | undefined {
    return this.extractors.get(name);
  }

  /**
   * Get a specific transformer
   */
  getTransformer(name: string): ITransformer | undefined {
    return this.transformers.get(name);
  }

  /**
   * Get a specific loader
   */
  getLoader(name: string): ILoader | undefined {
    return this.loaders.get(name);
  }

  /**
   * Check if a plugin is registered
   */
  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Clear all plugins
   */
  async clearAll(): Promise<void> {
    const pluginNames = Array.from(this.plugins.keys());
    
    for (const pluginName of pluginNames) {
      await this.unregisterPlugin(pluginName);
    }
  }
}