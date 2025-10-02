// Core exports
export { ETL, etl } from './core/etl';
export { ETLPipeline } from './core/pipeline';

// Type exports
export type {
  IExtractor,
  ITransformer,
  ILoader,
  IPlugin,
  ETLConfig,
  ETLStep,
  ETLPipeline as ETLPipelineType,
  ETLResult,
  JoinConfig,
  CacheEntry,
  StreamConfig,
  ErrorRecoveryConfig,
  PermalinkOptions,
  PermalinkResult
} from './types';

// Extractor exports
export { ApiExtractor } from './extractors/api';
export { HtmlExtractor } from './extractors/html';
export { CsvExtractor } from './extractors/csv';
export { LocalStorageExtractor } from './extractors/localStorage';
export { IndexedDBExtractor } from './extractors/indexedDB';
export { FileExtractor } from './extractors/file';

// Transformer exports
export { FilterTransformer } from './transformers/filter';
export { MapTransformer } from './transformers/map';
export { JoinTransformer } from './transformers/join';
export { EnrichTransformer } from './transformers/enrich';

// Loader exports
export { ChartLoader } from './loaders/chart';
export { TableLoader } from './loaders/table';
export { FileLoader } from './loaders/file';
export { ApiLoader } from './loaders/api';

// Plugin exports
export { PluginManager } from './plugins/plugin-manager';

// Utility exports
export { Cache } from './utils/cache';
export { StreamProcessor } from './utils/stream';
export { ErrorRecovery } from './utils/error-recovery';
export { 
  generatePermalink, 
  createHtmlPermalink, 
  createDemoPermalink, 
  copyPermalinkToClipboard, 
  createShareButton 
} from './utils/permalink';

// Default export
export { etl as default } from './core/etl';