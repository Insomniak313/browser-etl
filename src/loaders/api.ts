import { ILoader } from '../types';

export interface ApiLoaderConfig {
  url: string;
  options?: RequestInit;
  headers?: Record<string, string>;
  method?: string;
  body?: any;
  timeout?: number;
  retries?: number;
}

/**
 * API Loader - loads data to external APIs
 */
export class ApiLoader implements ILoader {
  readonly name = 'api';

  async load(data: any, config: ApiLoaderConfig): Promise<void> {
    const {
      url,
      options = {},
      headers = {},
      method = 'POST',
      body,
      timeout = 30000,
      retries = 3
    } = config;

    if (!url) {
      throw new Error('URL is required for API loading');
    }

    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...options.headers
      },
      ...options
    };

    // Use provided body or data
    const requestBody = body !== undefined ? body : data;
    if (requestBody) {
      requestOptions.body = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody);
    }

    await this.fetchWithRetry(url, requestOptions, retries, timeout);
  }

  supports(config: any): boolean {
    return config && typeof config.url === 'string';
  }

  private async fetchWithRetry(
    url: string, 
    options: RequestInit, 
    retries: number, 
    timeout: number
  ): Promise<Response> {
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

        return response;

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