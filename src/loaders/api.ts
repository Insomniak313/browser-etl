import { ILoader } from '../types';
import { HttpClient } from '../utils/http-client';

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
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

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

    // Use provided body or data
    const requestBody = body !== undefined ? body : data;

    await this.httpClient.request(url, {
      method,
      headers,
      body: requestBody,
      timeout,
      retries,
      ...options
    });
  }

  supports(config: any): boolean {
    return config && typeof config.url === 'string';
  }

}