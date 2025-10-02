import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiExtractor } from '../../src/extractors/api';

// Mock fetch
global.fetch = vi.fn();

describe('ApiExtractor', () => {
  let extractor: ApiExtractor;

  beforeEach(() => {
    extractor = new ApiExtractor();
    vi.clearAllMocks();
  });

  it('should extract data from API successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
      headers: {
        get: () => 'application/json'
      }
    });

    const result = await extractor.extract({
      url: 'https://api.example.com/test'
    });

    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
  });

  it('should handle text responses', async () => {
    const mockText = 'Hello World';
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockText),
      headers: {
        get: () => 'text/plain'
      }
    });

    const result = await extractor.extract({
      url: 'https://api.example.com/test'
    });

    expect(result).toBe(mockText);
  });

  it('should handle POST requests with body', async () => {
    const mockData = { id: 1, name: 'Test' };
    const requestBody = { name: 'New Test' };
    
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
      headers: {
        get: () => 'application/json'
      }
    });

    await extractor.extract({
      url: 'https://api.example.com/test',
      method: 'POST',
      body: requestBody
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(requestBody)
      })
    );
  });

  it('should retry on failure', async () => {
    const mockData = { id: 1, name: 'Test' };
    
    (fetch as any)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
        headers: {
          get: () => 'application/json'
        }
      });

    const result = await extractor.extract({
      url: 'https://api.example.com/test',
      retries: 2
    });

    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('should throw error after max retries', async () => {
    (fetch as any).mockRejectedValue(new Error('Network error'));

    await expect(extractor.extract({
      url: 'https://api.example.com/test',
      retries: 1
    })).rejects.toThrow('Network error');
  });

  it('should handle HTTP error responses', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    await expect(extractor.extract({
      url: 'https://api.example.com/test'
    })).rejects.toThrow('HTTP 404: Not Found');
  });

  it('should support configuration validation', () => {
    expect(extractor.supports({ url: 'https://api.example.com' })).toBe(true);
    expect(extractor.supports({})).toBe(false);
    expect(extractor.supports({ url: 123 })).toBe(false);
  });

  it('should have correct name', () => {
    expect(extractor.name).toBe('api');
  });
});