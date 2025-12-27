/**
 * usePaymentHistory Hook
 * Fetches user's payment history (optional feature)
 */

import { useState, useCallback, useEffect } from "react"
import type { PaymentOrder } from "../types/payment"

interface UsePaymentHistoryReturn {
  history: PaymentOrder[]
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
}

export function usePaymentHistory(userId?: string): UsePaymentHistoryReturn {
  const [history, setHistory] = useState<PaymentOrder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    if (!userId) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await window.fetch(
        `/api/payments/history?page=1&limit=20`,
        {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error("Failed to fetch payment history")
      }

      const data = await response.json()
      setHistory(data.data?.orders || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
      setHistory([])
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetch()
  }, [fetch])

  const refresh = useCallback(async () => {
    await fetch()
  }, [fetch])

  return {
    history,
    isLoading,
    error,
    refresh,
  }
}
