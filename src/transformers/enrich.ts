import { ITransformer } from '../types';

export interface EnrichTransformerConfig {
  fn: (item: any) => Promise<any>;
  parallel?: boolean;
  batchSize?: number;
}

/**
 * Enrich Transformer - enriches data using async functions
 */
export class EnrichTransformer implements ITransformer {
  readonly name = 'enrich';

  async transform(data: any, config: EnrichTransformerConfig): Promise<any> {
    const { fn, parallel = true, batchSize = 10 } = config;

    if (!fn) {
      throw new Error('Enrichment function is required');
    }

    if (Array.isArray(data)) {
      if (parallel) {
        return await this.enrichParallel(data, fn, batchSize);
      } else {
        return await this.enrichSequential(data, fn);
      }
    }

    if (typeof data === 'object' && data !== null) {
      const enriched: any = {};
      
      if (parallel) {
        const entries = Object.entries(data);
        const enrichedEntries = await this.enrichParallel(entries, fn, batchSize);
        enrichedEntries.forEach(([key, value]) => {
          enriched[key] = value;
        });
      } else {
        for (const [key, value] of Object.entries(data)) {
          enriched[key] = await fn({ key, value });
        }
      }
      
      return enriched;
    }

    // For primitive values, apply the enrichment function
    return await fn(data);
  }

  supports(config: any): boolean {
    return config && typeof config.fn === 'function';
  }

  private async enrichParallel(data: any[], fn: (item: any) => Promise<any>, batchSize: number): Promise<any[]> {
    const results: any[] = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const batchPromises = batch.map(item => fn(item));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  private async enrichSequential(data: any[], fn: (item: any) => Promise<any>): Promise<any[]> {
    const results: any[] = [];
    
    for (const item of data) {
      const result = await fn(item);
      results.push(result);
    }
    
    return results;
  }
}