import { ITransformer } from '../types';

export interface JoinTransformerConfig {
  type: 'api' | 'data';
  url?: string;
  data?: any;
  options?: RequestInit;
  joinFn?: (left: any, right: any) => any;
  key: string;
  mode: 'nested' | 'parallel';
}

/**
 * Join Transformer - joins data with another dataset
 */
export class JoinTransformer implements ITransformer {
  readonly name = 'join';

  async transform(data: any, config: JoinTransformerConfig): Promise<any> {
    const { key, mode, type, url, data: joinData, options, joinFn } = config;

    if (!key) {
      throw new Error('Join key is required');
    }

    let rightData: any;

    if (type === 'api' && url) {
      rightData = await this.fetchJoinData(url, options);
    } else if (type === 'data' && joinData) {
      rightData = joinData;
    } else {
      throw new Error('Invalid join configuration');
    }

    if (mode === 'nested') {
      return this.nestedJoin(data, rightData, key, joinFn);
    } else {
      return this.parallelJoin(data, rightData, key, joinFn);
    }
  }

  supports(config: any): boolean {
    return config && 
           config.key && 
           config.mode && 
           config.type && 
           (config.url || config.data);
  }

  private async fetchJoinData(url: string, options?: RequestInit): Promise<any> {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Failed to fetch join data: ${response.statusText}`);
    }
    return await response.json();
  }

  private nestedJoin(leftData: any, rightData: any, key: string, joinFn?: (left: any, right: any) => any): any {
    if (!Array.isArray(leftData) || !Array.isArray(rightData)) {
      throw new Error('Both datasets must be arrays for joining');
    }

    const rightMap = new Map();
    rightData.forEach((item: any) => {
      const keyValue = this.getNestedValue(item, key);
      if (keyValue !== undefined) {
        rightMap.set(keyValue, item);
      }
    });

    return leftData.map((leftItem: any) => {
      const keyValue = this.getNestedValue(leftItem, key);
      const rightItem = rightMap.get(keyValue);

      if (joinFn) {
        return joinFn(leftItem, rightItem);
      }

      if (rightItem) {
        return { ...leftItem, ...rightItem };
      }

      return leftItem;
    });
  }

  private parallelJoin(leftData: any, rightData: any, key: string, joinFn?: (left: any, right: any) => any): any {
    if (!Array.isArray(leftData) || !Array.isArray(rightData)) {
      throw new Error('Both datasets must be arrays for joining');
    }

    const result: any[] = [];
    const leftMap = new Map();
    const rightMap = new Map();

    // Build maps for both datasets
    leftData.forEach((item: any) => {
      const keyValue = this.getNestedValue(item, key);
      if (keyValue !== undefined) {
        leftMap.set(keyValue, item);
      }
    });

    rightData.forEach((item: any) => {
      const keyValue = this.getNestedValue(item, key);
      if (keyValue !== undefined) {
        rightMap.set(keyValue, item);
      }
    });

    // Process all unique keys
    const allKeys = new Set([...leftMap.keys(), ...rightMap.keys()]);

    allKeys.forEach(keyValue => {
      const leftItem = leftMap.get(keyValue);
      const rightItem = rightMap.get(keyValue);

      if (joinFn) {
        result.push(joinFn(leftItem, rightItem));
      } else {
        result.push({ ...leftItem, ...rightItem });
      }
    });

    return result;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }
}