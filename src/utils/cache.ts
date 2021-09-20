import NodeCache from 'node-cache';
import sizeof from 'object-sizeof';
import { Key } from './typings';

/**
 * @class
 * Cache class
 * Singleton
 * Implements caching using node-cache module
 */
class CacheLocal {
  private static _instance: CacheLocal;

  private cache: NodeCache;
  private cacheMaxAge: number;
  private cacheAllocatedMemory: number;

  /**
   * @constructor
   * @param cacheMaxAge
   * @param cacheAllocatedMemory
   */
  private constructor(cacheMaxAge: number, cacheAllocatedMemory: number) {
    this.cacheMaxAge = cacheMaxAge || 3600;
    this.cacheAllocatedMemory = cacheAllocatedMemory || 64;
    this.cache = new NodeCache({
      stdTTL: this.cacheMaxAge,
      checkperiod: this.cacheMaxAge * 0.2,
      useClones: false,
      deleteOnExpire: true,
    });
  }

  /**
   * Function to created single instance
   * @param cacheMaxAge
   * @param cacheAllocatedMemory
   * @returns
   */
  public static getInstance(cacheMaxAge: number, cacheAllocatedMemory: number): CacheLocal {
    if (!CacheLocal._instance) {
      CacheLocal._instance = new CacheLocal(cacheMaxAge, cacheAllocatedMemory);
    }
    return CacheLocal._instance;
  }
  /**
   * Checks if cache if full on every write
   * @param calcSize
   * @returns
   */
  private isCacheFull(calcSize: number): boolean {
    /* tslint:disable:no-bitwise */
    return calcSize >= this.cacheAllocatedMemory << 20;
  }

  /**
   * Gets key from the cache
   * @param key
   * @returns
   */
  public get<T>(key: Key): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Sets key value in the cache
   * @param key
   * @param value
   */
  public set<T>(key: Key, value: T): void {
    const keyValueSize = sizeof(key) + sizeof(value);
    const cacheSize = sizeof(this.cache);
    const totalSize = keyValueSize + cacheSize;
    const cacheFull = this.isCacheFull(totalSize);
    // LRU needs to be implemented
    if (cacheFull) this.cache.flushAll();
    this.cache.set(key, value);
  }
}

export default CacheLocal;
