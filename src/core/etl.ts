import { ETLPipeline } from './pipeline';
import { ApiExtractor } from '../extractors/api';
import { HtmlExtractor } from '../extractors/html';
import { CsvExtractor } from '../extractors/csv';
import { LocalStorageExtractor } from '../extractors/localStorage';
import { IndexedDBExtractor } from '../extractors/indexedDB';
import { FileExtractor } from '../extractors/file';
import { FilterTransformer } from '../transformers/filter';
import { MapTransformer } from '../transformers/map';
import { JoinTransformer } from '../transformers/join';
import { EnrichTransformer } from '../transformers/enrich';
import { ChartLoader } from '../loaders/chart';
import { TableLoader } from '../loaders/table';
import { FileLoader } from '../loaders/file';
import { ApiLoader } from '../loaders/api';
import { ETLConfig } from '../types';

/**
 * Main ETL class that provides a fluent API
 */
export class ETL {
  private pipeline: ETLPipeline;
  
  extract!: {
    api: (url: string, options?: RequestInit) => ETL;
    html: (selector: string, url?: string) => ETL;
    csv: (data: string | File, options?: any) => ETL;
    localStorage: (key: string) => ETL;
    indexedDB: (storeName: string, query?: any) => ETL;
    file: (file: File, type?: string) => ETL;
  };
  
  join!: {
    api: (url: string, config: any) => ETL;
    data: (data: any, config: any) => ETL;
  };
  
  load!: {
    chart: (type: string, config: any) => ETL;
    table: (container: string | HTMLElement, config?: any) => ETL;
    file: (filename: string, format?: string) => ETL;
    api: (url: string, options?: RequestInit) => ETL;
  };

  constructor(config?: ETLConfig) {
    this.pipeline = new ETLPipeline(config);
    this.registerDefaultComponents();
    this.initializeMethods();
  }

  /**
   * Register default extractors, transformers, and loaders
   */
  private registerDefaultComponents(): void {
    // Register extractors
    this.pipeline
      .registerExtractor(new ApiExtractor())
      .registerExtractor(new HtmlExtractor())
      .registerExtractor(new CsvExtractor())
      .registerExtractor(new LocalStorageExtractor())
      .registerExtractor(new IndexedDBExtractor())
      .registerExtractor(new FileExtractor());

    // Register transformers
    this.pipeline
      .registerTransformer(new FilterTransformer())
      .registerTransformer(new MapTransformer())
      .registerTransformer(new JoinTransformer())
      .registerTransformer(new EnrichTransformer());

    // Register loaders
    this.pipeline
      .registerLoader(new ChartLoader())
      .registerLoader(new TableLoader())
      .registerLoader(new FileLoader())
      .registerLoader(new ApiLoader());
  }

  /**
   * Initialize method objects
   */
  private initializeMethods(): void {
    this.extract = {
      api: (url: string, options?: RequestInit) => {
        this.pipeline.extract('api', { url, options });
        return this;
      },
      
      html: (selector: string, url?: string) => {
        this.pipeline.extract('html', { selector, url });
        return this;
      },
      
      csv: (data: string | File, options?: any) => {
        this.pipeline.extract('csv', { data, options });
        return this;
      },
      
      localStorage: (key: string) => {
        this.pipeline.extract('localStorage', { key });
        return this;
      },
      
      indexedDB: (storeName: string, query?: any) => {
        this.pipeline.extract('indexedDB', { storeName, query });
        return this;
      },
      
      file: (file: File, type?: string) => {
        this.pipeline.extract('file', { file, type });
        return this;
      }
    };

    this.join = {
      api: (url: string, config: any) => {
        this.pipeline.transform('join', { 
          type: 'api', 
          url, 
          config 
        });
        return this;
      },
      
      data: (data: any, config: any) => {
        this.pipeline.transform('join', { 
          type: 'data', 
          data, 
          config 
        });
        return this;
      }
    };

    this.load = {
      chart: (type: string, config: any) => {
        this.pipeline.load('chart', { type, config });
        return this;
      },
      
      table: (container: string | HTMLElement, config?: any) => {
        this.pipeline.load('table', { container, config });
        return this;
      },
      
      file: (filename: string, format?: string) => {
        this.pipeline.load('file', { filename, format });
        return this;
      },
      
      api: (url: string, options?: RequestInit) => {
        this.pipeline.load('api', { url, options });
        return this;
      }
    };
  }


  /**
   * Transform data
   */
  transform = (fn: (data: any) => any) => {
    this.pipeline.transform('map', { fn });
    return this;
  };


  /**
   * Filter data
   */
  filter = (fn: (item: any) => boolean) => {
    this.pipeline.transform('filter', { fn });
    return this;
  };

  /**
   * Map data
   */
  map = (fn: (item: any) => any) => {
    this.pipeline.transform('map', { fn });
    return this;
  };

  /**
   * Enrich data
   */
  enrich = (fn: (item: any) => Promise<any>) => {
    this.pipeline.transform('enrich', { fn });
    return this;
  };


  /**
   * Run the pipeline
   */
  async run(): Promise<any> {
    const result = await this.pipeline.run();
    if (!result.success) {
      throw result.error;
    }
    return result.data;
  }

  /**
   * Get the underlying pipeline
   */
  getPipeline(): ETLPipeline {
    return this.pipeline;
  }
}

/**
 * Create a new ETL instance
 */
export function etl(config?: ETLConfig): ETL {
  return new ETL(config);
}

export default etl;