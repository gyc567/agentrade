/**
 * useStorageCache Hook
 * 可复用的缓存工具，支持 TTL（生存时间）
 *
 * [M1 分离缓存层] KISS 原则实现
 * - 纯函数，易于测试
 * - 0 依赖，支持泛型 <T>
 * - 自动处理过期检查
 */

// Inline logger to avoid circular dependency
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV

const cacheLogger = {
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args)
  }
}

/**
 * 创建一个 localStorage 缓存工具
 *
 * @param key - 缓存键名
 * @param ttl - 缓存生存时间（毫秒）
 * @returns 缓存管理对象
 *
 * @example
 * ```typescript
 * const cache = createStorageCache<PaymentPackage[]>('pricing', 5 * 60 * 1000)
 *
 * // 设置缓存
 * cache.set(packages)
 *
 * // 获取缓存（自动检查过期）
 * const packages = cache.get() // PaymentPackage[] | null
 *
 * // 清除缓存
 * cache.clear()
 * ```
 */
export function createStorageCache<T>(key: string, ttl: number) {
  interface CacheData<T> {
    value: T
    timestamp: number
  }

  /**
   * 获取缓存数据
   * 如果过期返回 null 并自动清除
   */
  const get = (): T | null => {
    try {
      const item = localStorage.getItem(key)
      if (!item) return null

      const cached: CacheData<T> = JSON.parse(item)
      const now = Date.now()
      const age = now - cached.timestamp

      // 检查是否过期
      if (age > ttl) {
        localStorage.removeItem(key)
        return null
      }

      return cached.value
    } catch (error) {
      // JSON.parse 失败或其他错误，清除坏数据
      cacheLogger.warn(`[Cache] Failed to read cache for "${key}":`, error)
      localStorage.removeItem(key)
      return null
    }
  }

  /**
   * 设置缓存数据
   * 自动记录时间戳
   */
  const set = (value: T): void => {
    try {
      const data: CacheData<T> = {
        value,
        timestamp: Date.now()
      }
      localStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      cacheLogger.warn(`[Cache] Failed to set cache for "${key}":`, error)
      // 缓存写入失败（quota exceeded等），继续运行但数据不会被缓存
    }
  }

  /**
   * 清除缓存
   */
  const clear = (): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      cacheLogger.warn(`[Cache] Failed to clear cache for "${key}":`, error)
    }
  }

  return {
    get,
    set,
    clear
  }
}

/**
 * React Hook：在组件中使用缓存
 *
 * @param key - 缓存键名
 * @param ttl - 缓存生存时间（毫秒）
 * @returns 缓存管理对象（稳定引用）
 *
 * @example
 * ```typescript
 * const cache = useStorageCache<PaymentPackage[]>('pricing', 5 * 60 * 1000)
 *
 * // 在 useEffect 中使用
 * useEffect(() => {
 *   const cached = cache.get()
 *   if (cached) {
 *     setPackages(cached)
 *   } else {
 *     fetchPackagesFromAPI()
 *   }
 * }, [cache])
 * ```
 */
import { useMemo } from 'react'

export function useStorageCache<T>(key: string, ttl: number) {
  // useMemo 确保缓存对象的引用稳定
  // 这样 useEffect 依赖数组中使用时不会导致重新渲染
  return useMemo(() => createStorageCache<T>(key, ttl), [key, ttl])
}

export default useStorageCache
