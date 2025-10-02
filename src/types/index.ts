/**
 * Core types for Browser ETL library
 */

export interface IExtractor<T = any> {
  /**
   * Extract data from a source
   * @param config Configuration for the extraction
   * @returns Promise resolving to extracted data
   */
  extract(config?: any): Promise<T>;
  
  /**
   * Get the name of this extractor
   */
  readonly name: string;
  
  /**
   * Check if this extractor supports the given configuration
   */
  supports(config: any): boolean;
}

export interface ITransformer<TInput = any, TOutput = any> {
  /**
   * Transform input data
   * @param data Input data to transform
   * @param config Configuration for the transformation
   * @returns Promise resolving to transformed data
   */
  transform(data: TInput, config?: any): Promise<TOutput>;
  
  /**
   * Get the name of this transformer
   */
  readonly name: string;
  
  /**
   * Check if this transformer supports the given configuration
   */
  supports(config: any): boolean;
}

export interface ILoader<T = any> {
  /**
   * Load data to a destination
   * @param data Data to load
   * @param config Configuration for the loading
   * @returns Promise resolving when loading is complete
   */
  load(data: T, config?: any): Promise<void | any>;
  
  /**
   * Get the name of this loader
   */
  readonly name: string;
  
  /**
   * Check if this loader supports the given configuration
   */
  supports(config: any): boolean;
}

export interface IPlugin {
  /**
   * Plugin name
   */
  readonly name: string;
  
  /**
   * Plugin version
   */
  readonly version: string;
  
  /**
   * Initialize the plugin
   */
  initialize(): Promise<void>;
  
  /**
   * Cleanup the plugin
   */
  cleanup(): Promise<void>;
  
  /**
   * Get extractors provided by this plugin
   */
  getExtractors(): IExtractor[];
  
  /**
   * Get transformers provided by this plugin
   */
  getTransformers(): ITransformer[];
  
  /**
   * Get loaders provided by this plugin
   */
  getLoaders(): ILoader[];
}

export interface ETLConfig {
  /**
   * Enable caching for extractors
   */
  enableCache?: boolean;
  
  /**
   * Cache duration in milliseconds
   */
  cacheDuration?: number;
  
  /**
   * Enable parallel processing
   */
  enableParallel?: boolean;
  
  /**
   * Maximum number of parallel operations
   */
  maxParallel?: number;
  
  /**
   * Enable streaming for large datasets
   */
  enableStreaming?: boolean;
  
  /**
   * Batch size for streaming operations
   */
  batchSize?: number;
  
  /**
   * Enable error recovery
   */
  enableErrorRecovery?: boolean;
  
  /**
   * Maximum number of retry attempts
   */
  maxRetries?: number;
}

export interface ETLStep {
  /**
   * Step type
   */
  type: 'extract' | 'transform' | 'load';
  
  /**
   * Step configuration
   */
  config: any;
  
  /**
   * Step name
   */
  name: string;
  
  /**
   * Whether this step is optional
   */
  optional?: boolean;
}

export interface ETLPipeline {
  /**
   * Pipeline steps
   */
  steps: ETLStep[];
  
  /**
   * Pipeline configuration
   */
  config: ETLConfig;
  
  /**
   * Pipeline name
   */
  name: string;
}

export interface ETLResult<T = any> {
  /**
   * Result data
   */
  data: T;
  
  /**
   * Execution metadata
   */
  metadata: {
    duration: number;
    steps: Array<{
      name: string;
      duration: number;
      success: boolean;
      error?: string;
    }>;
    cacheHits: number;
    cacheMisses: number;
  };
  
  /**
   * Whether the pipeline executed successfully
   */
  success: boolean;
  
  /**
   * Error if any occurred
   */
  error?: Error;
}

export interface JoinConfig {
  /**
   * Key to join on
   */
  key: string;
  
  /**
   * Join mode: nested or parallel
   */
  mode: 'nested' | 'parallel';
  
  /**
   * Join type: inner, left, right, outer
   */
  type?: 'inner' | 'left' | 'right' | 'outer';
  
  /**
   * Custom join function
   */
  joinFn?: (left: any, right: any) => any;
}

export interface CacheEntry<T = any> {
  /**
   * Cached data
   */
  data: T;
  
  /**
   * Timestamp when cached
   */
  timestamp: number;
  
  /**
   * Cache key
   */
  key: string;
  
  /**
   * Time to live in milliseconds
   */
  ttl: number;
}

export interface StreamConfig {
  /**
   * Enable streaming
   */
  enabled: boolean;
  
  /**
   * Batch size for streaming
   */
  batchSize: number;
  
  /**
   * Stream buffer size
   */
  bufferSize: number;
  
  /**
   * Stream timeout in milliseconds
   */
  timeout: number;
}

export interface ErrorRecoveryConfig {
  /**
   * Enable error recovery
   */
  enabled: boolean;
  
  /**
   * Maximum retry attempts
   */
  maxRetries: number;
  
  /**
   * Retry delay in milliseconds
   */
  retryDelay: number;
  
  /**
   * Exponential backoff multiplier
   */
  backoffMultiplier: number;
  
  /**
   * Maximum retry delay in milliseconds
   */
  maxRetryDelay: number;
}

export interface PermalinkOptions {
  /**
   * The GitHub repository URL (e.g., 'https://github.com/user/repo')
   */
  repository: string;
  
  /**
   * The branch name (default: 'main')
   */
  branch?: string;
  
  /**
   * The file path in the repository
   */
  filePath: string;
  
  /**
   * Additional query parameters for the preview
   */
  queryParams?: Record<string, string>;
}

export interface PermalinkResult {
  /**
   * The generated permalink URL
   */
  url: string;
  
  /**
   * The htmlpreview URL
   */
  previewUrl: string;
  
  /**
   * Whether the permalink was generated successfully
   */
  success: boolean;
  
  /**
   * Error message if generation failed
   */
  error?: string;
}