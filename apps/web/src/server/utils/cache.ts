/**
 * Simple TTL-based in-memory cache utility
 * Used for caching Alpha Vantage API responses to reduce API calls
 */

interface CacheItem<T> {
  data: T;
  expiry: number;
}

class MemoryCache<T> {
  private cache = new Map<string, CacheItem<T>>();

  /**
   * Store data in cache with TTL
   */
  set(key: string, data: T, ttlMinutes: number): void {
    const expiry = Date.now() + (ttlMinutes * 60 * 1000);
    this.cache.set(key, { data, expiry });
  }

  /**
   * Retrieve data from cache if not expired
   */
  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Export singleton cache instance for stock data
export const stockDataCache = new MemoryCache<unknown>();

// Cleanup expired entries every 5 minutes
if (typeof global !== 'undefined') {
  setInterval(() => {
    stockDataCache.cleanup();
  }, 5 * 60 * 1000);
}