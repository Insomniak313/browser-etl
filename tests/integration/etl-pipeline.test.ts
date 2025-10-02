import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ETLPipeline } from '../../src/core/pipeline';
import { ApiExtractor } from '../../src/extractors/api';
import { FilterTransformer } from '../../src/transformers/filter';
import { TableLoader } from '../../src/loaders/table';

// Mock fetch
global.fetch = vi.fn();

// Mock DOM
Object.defineProperty(window, 'document', {
  value: {
    createElement: vi.fn(() => ({
      appendChild: vi.fn(),
      getContext: vi.fn(() => ({})),
      style: {}
    })),
    querySelector: vi.fn(() => ({
      appendChild: vi.fn(),
      innerHTML: ''
    })),
    body: {
      appendChild: vi.fn()
    }
  }
});

describe('ETL Pipeline Integration', () => {
  let pipeline: ETLPipeline;

  beforeEach(() => {
    pipeline = new ETLPipeline();
    vi.clearAllMocks();
  });

  it('should execute a complete ETL pipeline', async () => {
    // Mock API response
    const mockData = [
      { id: 1, name: 'John', age: 25 },
      { id: 2, name: 'Jane', age: 30 },
      { id: 3, name: 'Bob', age: 35 }
    ];

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
      headers: {
        get: () => 'application/json'
      }
    });

    // Register components
    pipeline
      .registerExtractor(new ApiExtractor())
      .registerTransformer(new FilterTransformer())
      .registerLoader(new TableLoader());

    // Build pipeline
    pipeline
      .extract('api', { url: 'https://api.example.com/users' })
      .transform('filter', { fn: (user: any) => user.age > 25 })
      .load('table', { container: '#table-container' });

    // Execute pipeline
    const result = await pipeline.run();

    expect(result.success).toBe(true);
    expect(result.data).toEqual([
      { id: 2, name: 'Jane', age: 30 },
      { id: 3, name: 'Bob', age: 35 }
    ]);
    expect(result.metadata.steps).toHaveLength(3);
    expect(result.metadata.steps.every(step => step.success)).toBe(true);
  });

  it('should handle pipeline errors gracefully', async () => {
    // Mock API failure
    (fetch as any).mockRejectedValue(new Error('Network error'));

    pipeline
      .registerExtractor(new ApiExtractor())
      .extract('api', { url: 'https://api.example.com/users' });

    const result = await pipeline.run();

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.metadata.steps[0].success).toBe(false);
  });

  it('should use caching when enabled', async () => {
    const mockData = [{ id: 1, name: 'Test' }];

    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
      headers: {
        get: () => 'application/json'
      }
    });

    pipeline
      .registerExtractor(new ApiExtractor())
      .extract('api', { url: 'https://api.example.com/users' })
      .extract('api', { url: 'https://api.example.com/users' }); // Same request

    const result = await pipeline.run();

    expect(result.success).toBe(true);
    // Should only call fetch once due to caching
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle optional steps', async () => {
    const mockData = [{ id: 1, name: 'Test' }];

    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
      headers: {
        get: () => 'application/json'
      }
    });

    pipeline
      .registerExtractor(new ApiExtractor())
      .extract('api', { url: 'https://api.example.com/users' });

    // Add optional step that will fail
    const steps = pipeline['steps'];
    steps.push({
      type: 'extract',
      name: 'api',
      config: { url: 'https://api.example.com/invalid' },
      optional: true
    });

    const result = await pipeline.run();

    expect(result.success).toBe(true); // Should succeed despite optional step failure
    expect(result.metadata.steps).toHaveLength(2);
  });

  it('should provide execution metadata', async () => {
    const mockData = [{ id: 1, name: 'Test' }];

    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
      headers: {
        get: () => 'application/json'
      }
    });

    pipeline
      .registerExtractor(new ApiExtractor())
      .extract('api', { url: 'https://api.example.com/users' });

    const result = await pipeline.run();

    expect(result.metadata.duration).toBeGreaterThan(0);
    expect(result.metadata.steps).toHaveLength(1);
    expect(result.metadata.steps[0].duration).toBeGreaterThan(0);
    expect(result.metadata.steps[0].success).toBe(true);
  });
});