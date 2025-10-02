import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiLoader } from '../../src/loaders/api';

// Mock fetch
global.fetch = vi.fn();

describe('ApiLoader', () => {
  let loader: ApiLoader;

  beforeEach(() => {
    loader = new ApiLoader();
    vi.clearAllMocks();
  });

  describe('load method', () => {
    it('should send POST request with data', async () => {
      const data = { name: 'John', age: 30 };
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK'
      };

      (fetch as any).mockResolvedValueOnce(mockResponse);

      await loader.load(data, {
        url: 'https://api.example.com/users',
        method: 'POST'
      });

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    });

    it('should send PUT request with data', async () => {
      const data = { name: 'John Updated', age: 31 };
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK'
      };

      (fetch as any).mockResolvedValueOnce(mockResponse);

      await loader.load(data, {
        url: 'https://api.example.com/users/1',
        method: 'PUT'
      });

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/users/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    });

    it('should send PATCH request with data', async () => {
      const data = { age: 32 };
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK'
      };

      (fetch as any).mockResolvedValueOnce(mockResponse);

      await loader.load(data, {
        url: 'https://api.example.com/users/1',
        method: 'PATCH'
      });

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/users/1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    });

    it('should use custom headers', async () => {
      const data = { name: 'John' };
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK'
      };

      (fetch as any).mockResolvedValueOnce(mockResponse);

      await loader.load(data, {
        url: 'https://api.example.com/users',
        headers: {
          'Authorization': 'Bearer token123',
          'X-Custom-Header': 'custom-value'
        }
      });

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token123',
          'X-Custom-Header': 'custom-value'
        },
        body: JSON.stringify(data)
      });
    });

    it('should use custom body', async () => {
      const data = { name: 'John' };
      const customBody = 'custom body content';
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK'
      };

      (fetch as any).mockResolvedValueOnce(mockResponse);

      await loader.load(data, {
        url: 'https://api.example.com/users',
        body: customBody
      });

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: customBody
      });
    });

    it('should merge options with default options', async () => {
      const data = { name: 'John' };
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK'
      };

      (fetch as any).mockResolvedValueOnce(mockResponse);

      await loader.load(data, {
        url: 'https://api.example.com/users',
        options: {
          method: 'PUT',
          headers: {
            'Authorization': 'Bearer token'
          },
          cache: 'no-cache'
        }
      });

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token'
        },
        cache: 'no-cache',
        body: JSON.stringify(data)
      });
    });

    it('should retry on failure', async () => {
      const data = { name: 'John' };
      const mockError = new Error('Network error');
      const mockSuccess = {
        ok: true,
        status: 200,
        statusText: 'OK'
      };

      (fetch as any)
        .mockRejectedValueOnce(mockError)
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(mockSuccess);

      await loader.load(data, {
        url: 'https://api.example.com/users',
        retries: 2
      });

      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('should throw error after max retries', async () => {
      const data = { name: 'John' };
      const mockError = new Error('Network error');

      (fetch as any).mockRejectedValue(mockError);

      await expect(loader.load(data, {
        url: 'https://api.example.com/users',
        retries: 1
      })).rejects.toThrow('Network error');
    });

    it('should handle HTTP error responses', async () => {
      const data = { name: 'John' };
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      };

      (fetch as any).mockResolvedValueOnce(mockResponse);

      await expect(loader.load(data, {
        url: 'https://api.example.com/users'
      })).rejects.toThrow('HTTP 400: Bad Request');
    });

    it('should handle timeout', async () => {
      const data = { name: 'John' };
      const mockError = new Error('The operation was aborted.');

      (fetch as any).mockRejectedValue(mockError);

      await expect(loader.load(data, {
        url: 'https://api.example.com/users',
        timeout: 1000,
        retries: 0
      })).rejects.toThrow('The operation was aborted.');
    });

    it('should throw error when URL is missing', async () => {
      await expect(loader.load({ name: 'John' }, {} as any))
        .rejects.toThrow('URL is required for API loading');
    });

    it('should handle string data', async () => {
      const data = 'Hello World';
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK'
      };

      (fetch as any).mockResolvedValueOnce(mockResponse);

      await loader.load(data, {
        url: 'https://api.example.com/text'
      });

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: '"Hello World"'
      });
    });

    it('should handle array data', async () => {
      const data = [1, 2, 3, 4, 5];
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK'
      };

      (fetch as any).mockResolvedValueOnce(mockResponse);

      await loader.load(data, {
        url: 'https://api.example.com/numbers'
      });

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    });

    it('should use default timeout and retries', async () => {
      const data = { name: 'John' };
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK'
      };

      (fetch as any).mockResolvedValueOnce(mockResponse);

      await loader.load(data, {
        url: 'https://api.example.com/users'
      });

      expect(fetch).toHaveBeenCalledWith('https://api.example.com/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    });
  });

  describe('supports method', () => {
    it('should support config with URL', () => {
      expect(loader.supports({ url: 'https://api.example.com' })).toBe(true);
    });

    it('should not support config without URL', () => {
      expect(loader.supports({})).toBe(false);
    });

    it('should not support config with non-string URL', () => {
      expect(loader.supports({ url: 123 })).toBe(false);
    });
  });

  describe('name property', () => {
    it('should have correct name', () => {
      expect(loader.name).toBe('api');
    });
  });
});