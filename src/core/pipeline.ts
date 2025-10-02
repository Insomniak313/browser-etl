import { 
  IExtractor, 
  ITransformer, 
  ILoader, 
  ETLConfig, 
  ETLStep, 
  ETLResult 
} from '../types';

/**
 * Main ETL Pipeline class
 */
export class ETLPipeline {
  private extractors: Map<string, IExtractor> = new Map();
  private transformers: Map<string, ITransformer> = new Map();
  private loaders: Map<string, ILoader> = new Map();
  private steps: ETLStep[] = [];
  private config: ETLConfig;
  private cache: Map<string, any> = new Map();
  private cacheTimestamps: Map<string, number> = new Map();

  constructor(config: ETLConfig = {}) {
    this.config = {
      enableCache: true,
      cacheDuration: 300000, // 5 minutes
      enableParallel: true,
      maxParallel: 10,
      enableStreaming: false,
      batchSize: 1000,
      enableErrorRecovery: true,
      maxRetries: 3,
      ...config
    };
  }

  /**
   * Register an extractor
   */
  registerExtractor(extractor: IExtractor): this {
    this.extractors.set(extractor.name, extractor);
    return this;
  }

  /**
   * Register a transformer
   */
  registerTransformer(transformer: ITransformer): this {
    this.transformers.set(transformer.name, transformer);
    return this;
  }

  /**
   * Register a loader
   */
  registerLoader(loader: ILoader): this {
    this.loaders.set(loader.name, loader);
    return this;
  }

  /**
   * Add an extract step
   */
  extract(extractorName: string, config?: any): this {
    this.steps.push({
      type: 'extract',
      name: extractorName,
      config: config || {}
    });
    return this;
  }

  /**
   * Add a transform step
   */
  transform(transformerName: string, config?: any): this {
    this.steps.push({
      type: 'transform',
      name: transformerName,
      config: config || {}
    });
    return this;
  }

  /**
   * Add a load step
   */
  load(loaderName: string, config?: any): this {
    this.steps.push({
      type: 'load',
      name: loaderName,
      config: config || {}
    });
    return this;
  }

  /**
   * Execute the pipeline
   */
  async run(): Promise<ETLResult> {
    const startTime = performance.now();
    const stepResults: Array<{
      name: string;
      duration: number;
      success: boolean;
      error?: string;
    }> = [];
    
    let cacheHits = 0;
    let cacheMisses = 0;
    let currentData: any = null;

    try {
      for (const step of this.steps) {
        const stepStartTime = performance.now();
        
        try {
          switch (step.type) {
            case 'extract':
              currentData = await this.executeExtractStep(step);
              break;
            case 'transform':
              currentData = await this.executeTransformStep(step, currentData);
              break;
            case 'load':
              await this.executeLoadStep(step, currentData);
              break;
          }
          
          const stepDuration = performance.now() - stepStartTime;
          stepResults.push({
            name: step.name,
            duration: stepDuration,
            success: true
          });
          
        } catch (error) {
          const stepDuration = performance.now() - stepStartTime;
          stepResults.push({
            name: step.name,
            duration: stepDuration,
            success: false,
            error: error instanceof Error ? error.message : String(error)
          });
          
          if (!step.optional) {
            throw error;
          }
        }
      }

      const totalDuration = performance.now() - startTime;
      
      return {
        data: currentData,
        metadata: {
          duration: totalDuration,
          steps: stepResults,
          cacheHits,
          cacheMisses
        },
        success: true
      };
      
    } catch (error) {
      const totalDuration = performance.now() - startTime;
      
      return {
        data: currentData,
        metadata: {
          duration: totalDuration,
          steps: stepResults,
          cacheHits,
          cacheMisses
        },
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  /**
   * Execute an extract step
   */
  private async executeExtractStep(step: ETLStep): Promise<any> {
    const extractor = this.extractors.get(step.name);
    if (!extractor) {
      throw new Error(`Extractor '${step.name}' not found`);
    }

    // Check cache if enabled
    if (this.config.enableCache) {
      const cacheKey = this.generateCacheKey(step);
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    const data = await extractor.extract(step.config);
    
    // Cache the result if enabled
    if (this.config.enableCache) {
      const cacheKey = this.generateCacheKey(step);
      this.setCachedData(cacheKey, data);
    }

    return data;
  }

  /**
   * Execute a transform step
   */
  private async executeTransformStep(step: ETLStep, data: any): Promise<any> {
    const transformer = this.transformers.get(step.name);
    if (!transformer) {
      throw new Error(`Transformer '${step.name}' not found`);
    }

    return await transformer.transform(data, step.config);
  }

  /**
   * Execute a load step
   */
  private async executeLoadStep(step: ETLStep, data: any): Promise<void> {
    const loader = this.loaders.get(step.name);
    if (!loader) {
      throw new Error(`Loader '${step.name}' not found`);
    }

    await loader.load(data, step.config);
  }

  /**
   * Generate cache key for a step
   */
  private generateCacheKey(step: ETLStep): string {
    return `${step.type}:${step.name}:${JSON.stringify(step.config)}`;
  }

  /**
   * Get cached data
   */
  private getCachedData(key: string): any | null {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) {
      return null;
    }

    const now = Date.now();
    if (now - timestamp > this.config.cacheDuration!) {
      this.cache.delete(key);
      this.cacheTimestamps.delete(key);
      return null;
    }

    return this.cache.get(key) || null;
  }

  /**
   * Set cached data
   */
  private setCachedData(key: string, data: any): void {
    this.cache.set(key, data);
    this.cacheTimestamps.set(key, Date.now());
  }

  /**
   * Clear cache
   */
  clearCache(): this {
    this.cache.clear();
    this.cacheTimestamps.clear();
    return this;
  }

  /**
   * Get pipeline configuration
   */
  getConfig(): ETLConfig {
    return { ...this.config };
  }

  /**
   * Update pipeline configuration
   */
  updateConfig(newConfig: Partial<ETLConfig>): this {
    this.config = { ...this.config, ...newConfig };
    return this;
  }
}