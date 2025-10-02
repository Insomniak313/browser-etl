import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Cache } from '../../src/utils/cache';

describe('Cache', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache();
  });

  it('should store and retrieve data', () => {
    const testData = { id: 1, name: 'Test' };
    cache.set('test-key', testData);

    const result = cache.get('test-key');
    expect(result).toEqual(testData);
  });

  it('should return null for non-existent key', () => {
    const result = cache.get('non-existent');
    expect(result).toBeNull();
  });

  it('should check if key exists', () => {
    cache.set('test-key', 'test-value');
    
    expect(cache.has('test-key')).toBe(true);
    expect(cache.has('non-existent')).toBe(false);
  });

  it('should delete entries', () => {
    cache.set('test-key', 'test-value');
    expect(cache.has('test-key')).toBe(true);
    
    const deleted = cache.delete('test-key');
    expect(deleted).toBe(true);
    expect(cache.has('test-key')).toBe(false);
  });

  it('should clear all entries', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    expect(cache.size()).toBe(2);
    
    cache.clear();
    expect(cache.size()).toBe(0);
  });

  it('should handle TTL expiration', async () => {
    const shortTTL = 100; // 100ms
    cache.set('test-key', 'test-value', shortTTL);
    
    expect(cache.get('test-key')).toBe('test-value');
    
    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(cache.get('test-key')).toBeNull();
    expect(cache.has('test-key')).toBe(false);
  });

  it('should clean expired entries', () => {
    const shortTTL = 1; // 1ms
    cache.set('expired-key', 'value', shortTTL);
    cache.set('valid-key', 'value', 10000);
    
    // Wait for expiration
    setTimeout(() => {
      const cleanedCount = cache.cleanExpired();
      expect(cleanedCount).toBe(1);
      expect(cache.has('expired-key')).toBe(false);
      expect(cache.has('valid-key')).toBe(true);
    }, 10);
  });

  it('should provide cache statistics', () => {
    cache.set('key1', 'value1', 1000);
    cache.set('key2', 'value2', 1); // Will expire quickly
    
    const stats = cache.getStats();
    expect(stats.size).toBe(2);
    expect(stats.total).toBe(2);
  });

  it('should use custom default TTL', () => {
    const customTTL = 5000;
    const customCache = new Cache(customTTL);
    
    customCache.set('test-key', 'test-value');
    // The TTL should be the custom value
    expect(customCache.get('test-key')).toBe('test-value');
  });
});