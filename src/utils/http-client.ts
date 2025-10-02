/**
 * HTTP Client utility for Browser ETL
 */

export interface HttpClientOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}

/**
 * HTTP Client with retry logic and timeout support
 */
export class HttpClient {
  private defaultOptions: HttpClientOptions;

  constructor(defaultOptions: HttpClientOptions = {}) {
    this.defaultOptions = {
      timeout: 30000,
      retries: 3,
      headers: {
        'Content-Type': 'application/json'
      },
      ...defaultOptions
    };
  }

  /**
   * Make a GET request
   */
  async get(url: string, options?: RequestInit & HttpClientOptions): Promise<Response> {
    return this.request(url, { ...options, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  async post(url: string, body?: any, options?: RequestInit & HttpClientOptions): Promise<Response> {
    return this.request(url, { ...options, method: 'POST', body });
  }

  /**
   * Make a PUT request
   */
  async put(url: string, body?: any, options?: RequestInit & HttpClientOptions): Promise<Response> {
    return this.request(url, { ...options, method: 'PUT', body });
  }

  /**
   * Make a DELETE request
   */
  async delete(url: string, options?: RequestInit & HttpClientOptions): Promise<Response> {
    return this.request(url, { ...options, method: 'DELETE' });
  }

  /**
   * Make a request with retry logic
   */
  async request(url: string, options: RequestInit & HttpClientOptions = {}): Promise<Response> {
    const {
      timeout = this.defaultOptions.timeout,
      retries = this.defaultOptions.retries,
      headers = {},
      ...requestOptions
    } = options;

    const requestInit: RequestInit = {
      headers: {
        ...this.defaultOptions.headers,
        ...headers,
        ...requestOptions.headers
      },
      ...requestOptions
    };

    if (requestInit.body && typeof requestInit.body !== 'string') {
      requestInit.body = JSON.stringify(requestInit.body);
    }

    return this.fetchWithRetry(url, requestInit, retries!, timeout!);
  }

  /**
   * Fetch with retry logic and exponential backoff
   */
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