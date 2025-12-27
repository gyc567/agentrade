/**
 * usePaymentPackages Hook
 * Fetches and caches payment packages
 */

import { useMemo } from "react"
import { PAYMENT_PACKAGES } from "../constants/packages"
import type { PaymentPackage } from "../types/payment"

interface UsePaymentPackagesReturn {
  packages: PaymentPackage[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function usePaymentPackages(): UsePaymentPackagesReturn {
  // In this implementation, packages are static constants
  // In the future, could be fetched from backend for dynamic pricing
  const packages = useMemo(() => {
    return Object.values(PAYMENT_PACKAGES)
  }, [])

  return {
    packages,
    isLoading: false,
    error: null,
    refetch: async () => {
      // No-op for static packages
    },
  }
}
