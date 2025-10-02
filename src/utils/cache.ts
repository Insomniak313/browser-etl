import { CacheEntry } from '../types';

/**
 * Cache utility for Browser ETL
 */
export class Cache {
  private storage: Map<string, CacheEntry> = new Map();
  private defaultTTL: number = 300000; // 5 minutes

  constructor(defaultTTL?: number) {
    if (defaultTTL) {
      this.defaultTTL = defaultTTL;
    }
  }

  /**
   * Set a cache entry
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      key,
      ttl: ttl || this.defaultTTL
    };

    this.storage.set(key, entry);
  }

  /**
   * Get a cache entry
   */
  get<T>(key: string): T | null {
    const entry = this.storage.get(key);
    
    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.storage.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if a key exists in cache
   */
  has(key: string): boolean {
    const entry = this.storage.get(key);
    
    if (!entry) {
      return false;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.storage.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a cache entry
   */
  delete(key: string): boolean {
    return this.storage.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.storage.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.storage.size;
  }

  /**
   * Clean expired entries
   */
  cleanExpired(): number {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.storage.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.storage.delete(key);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    expired: number;
    total: number;
  } {
    const now = Date.now();
    let expiredCount = 0;

    for (const entry of this.storage.values()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredCount++;
      }
    }

    return {
      size: this.storage.size,
      expired: expiredCount,
      total: this.storage.size
    };
  }
}