import { ITransformer } from '../types';

export interface MapTransformerConfig {
  fn: (item: any) => any;
}

/**
 * Map Transformer - transforms data using a mapping function
 */
export class MapTransformer implements ITransformer {
  readonly name = 'map';

  async transform(data: any, config: MapTransformerConfig): Promise<any> {
    const { fn } = config;

    if (!fn) {
      throw new Error('Map function is required');
    }

    if (Array.isArray(data)) {
      return data.map(fn);
    }

    if (typeof data === 'object' && data !== null) {
      const mapped: any = {};
      for (const [key, value] of Object.entries(data)) {
        const result = fn({ key, value });
        if (typeof result === 'object' && result !== null && 'key' in result && 'value' in result) {
          mapped[result.key] = result.value;
        } else {
          mapped[key] = result;
        }
      }
      return mapped;
    }

    // For primitive values, apply the map function
    return fn(data);
  }

  supports(config: any): boolean {
    return config && typeof config.fn === 'function';
  }
}