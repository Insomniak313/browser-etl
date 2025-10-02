import { IExtractor } from '../types';
import { HttpClient } from '../utils/http-client';

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
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

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

    const response = await this.httpClient.request(url, {
      method,
      headers,
      body,
      timeout,
      retries,
      ...options
    });

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  }

  supports(config: any): boolean {
    return config && typeof config.url === 'string';
  }

}