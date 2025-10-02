import { IExtractor } from '../types';

export interface LocalStorageExtractorConfig {
  key: string;
  parse?: boolean;
}

/**
 * LocalStorage Extractor - extracts data from browser localStorage
 */
export class LocalStorageExtractor implements IExtractor {
  readonly name = 'localStorage';

  async extract(config: LocalStorageExtractorConfig): Promise<any> {
    const { key, parse = true } = config;

    if (!key) {
      throw new Error('Key is required for localStorage extraction');
    }

    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('localStorage is not available in this environment');
    }

    const value = window.localStorage.getItem(key);

    if (value === null) {
      return null;
    }

    if (parse) {
      try {
        return JSON.parse(value);
      } catch {
        // Return as string if parsing fails
        return value;
      }
    }

    return value;
  }

  supports(config: any): boolean {
    return config && typeof config.key === 'string';
  }
}