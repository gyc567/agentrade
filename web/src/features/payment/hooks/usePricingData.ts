/**
 * usePricingData Hook
 *
 * Fetches pricing data from backend with caching and fallback support.
 * Features: 5-minute TTL cache, fallback to hardcoded packages, error handling
 *
 * [M1] 缓存层分离：使用 useStorageCache 作为独立的缓存工具
 * 优点：
 * - 缓存逻辑独立，便于测试和复用
 * - usePricingData 专注于数据获取，而非缓存实现
 * - 降低了复杂度（删除了40行自定义缓存代码）
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { PaymentPackage } from '../types/payment'
import { PAYMENT_PACKAGES } from '../constants/packages'
import { useStorageCache } from './useStorageCache'
import { paymentLogger } from '../utils/logger'

interface UsePricingDataResult {
  packages: PaymentPackage[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

// Cache key for localStorage
const PRICING_CACHE_KEY = 'pricing_data_cache'
const PRICING_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Hook to fetch and cache pricing data
 * Falls back to hardcoded packages if API fails
 */
export function usePricingData(): UsePricingDataResult {
  const [packages, setPackages] = useState<PaymentPackage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 使用 useStorageCache 管理缓存逻辑
  const pricingCache = useStorageCache<PaymentPackage[]>(PRICING_CACHE_KEY, PRICING_CACHE_TTL)

  /**
   * Fetch pricing data from API
   */
  const fetchPricingData = useCallback(async (): Promise<void> => {
    // Check cache first（使用 useStorageCache 管理 TTL 过期检查）
    const cachedData = pricingCache.get()
    if (cachedData && cachedData.length > 0) {
      setPackages(cachedData)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await fetch('/api/v1/credit-packages', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      })

      // Request was aborted
      if (controller.signal.aborted) {
        return
      }

      if (!response.ok) {
        throw new Error(
          `Failed to fetch pricing data: ${response.status} ${response.statusText}`
        )
      }

      const data = await response.json()

      // Handle nested data structure (some APIs wrap response in .data)
      const pkgs = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
          ? data.data
          : []

      if (pkgs.length === 0) {
        throw new Error('No pricing data returned from API')
      }

      setPackages(pkgs)
      pricingCache.set(pkgs)
      setError(null)
    } catch (err) {
      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }

      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error fetching pricing data'

      paymentLogger.error('[Pricing] API Error:', errorMessage)
      setError(err instanceof Error ? err : new Error(errorMessage))

      // Use fallback hardcoded packages
      const fallbackPackages = Object.values(PAYMENT_PACKAGES)
      setPackages(fallbackPackages)
      pricingCache.set(fallbackPackages)
    } finally {
      setLoading(false)
    }
  }, [pricingCache])

  /**
   * Refetch data (bypasses cache)
   */
  const refetch = useCallback(async (): Promise<void> => {
    // Clear cache to force fresh fetch
    pricingCache.clear()
    await fetchPricingData()
  }, [pricingCache, fetchPricingData])

  /**
   * Initial fetch
   */
  useEffect(() => {
    fetchPricingData()

    // Cleanup function: cancel pending requests on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchPricingData])

  return {
    packages,
    loading,
    error,
    refetch,
  }
}

export default usePricingData
