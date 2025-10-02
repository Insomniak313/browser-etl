import { ITransformer } from '../types';

export interface FilterTransformerConfig {
  fn: (item: any) => boolean;
}

/**
 * Filter Transformer - filters data based on a predicate function
 */
export class FilterTransformer implements ITransformer {
  readonly name = 'filter';

  async transform(data: any, config: FilterTransformerConfig): Promise<any> {
    const { fn } = config;

    if (!fn) {
      throw new Error('Filter function is required');
    }

    if (Array.isArray(data)) {
      return data.filter(fn);
    }

    if (typeof data === 'object' && data !== null) {
      const filtered: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (fn({ key, value })) {
          filtered[key] = value;
        }
      }
      return filtered;
    }

    // For primitive values, apply the filter function
    return fn(data) ? data : null;
  }

  supports(config: any): boolean {
    return config && typeof config.fn === 'function';
  }
}