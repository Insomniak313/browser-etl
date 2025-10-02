import { IExtractor } from '../types';

export interface ApiExtractorConfig {
  url: string;
  options?: RequestInit;
  headers?: Record<string, string>;
  method?: string;
  body?: any;
  timeout?: number;
  retries?: number;
}

/**
 * API Extractor - extracts data from REST APIs
 */
export class ApiExtractor implements IExtractor {
  readonly name = 'api';

  async extract(config: ApiExtractorConfig): Promise<any> {
    if (!config.url) {
      throw new Error('URL is required for API extraction');
    }

    const {
      url,
      options = {},
      headers = {},
      method = 'GET',
      body,
      timeout = 30000,
      retries = 3
    } = config;

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...options.headers
      },
      ...options
    };

    if (body) {
      requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    return await this.fetchWithRetry(url, requestOptions, retries, timeout);
  }

  supports(config: any): boolean {
    return config && typeof config.url === 'string';
  }

  private async fetchWithRetry(
    url: string, 
    options: RequestInit, 
    retries: number, 
    timeout: number
  ): Promise<any> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        } else {
          return await response.text();
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < retries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }
}