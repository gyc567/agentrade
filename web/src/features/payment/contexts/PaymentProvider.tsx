/**
 * Payment Provider Component
 * Provides payment context to child components
 *
 * [C2] 支持依赖注入：可以通过 apiService props 注入自定义的 API 实现
 * 优点：
 * - 向后兼容：不提供 apiService 时使用默认实现
 * - 易于测试：可以注入 mock 服务
 * - 支持多种环境：SSR、离线模式等
 */

import React, { useContext, useState, useCallback, useMemo } from "react"
import { PaymentContext } from "./PaymentContext"
import { PaymentOrchestrator } from "../services/PaymentOrchestrator"
import { CrossmintService } from "../services/CrossmintService"
import { getPackage } from "../services/paymentValidator"
import { createDefaultPaymentApiService } from "../services/PaymentApiService"
import type { PaymentContextType, PaymentPackage } from "../types/payment"
import type { PaymentApiService } from "../services/PaymentApiService"

interface PaymentProviderProps {
  children: React.ReactNode
  /**
   * 可选：注入自定义的 API 服务（用于测试）
   * 如果不提供，则使用默认实现
   */
  apiService?: PaymentApiService
}

export function PaymentProvider({ children, apiService }: PaymentProviderProps) {
  const [selectedPackage, setSelectedPackage] = useState<PaymentPackage | null>(
    null
  )
  const [paymentStatus, setPaymentStatus] = useState<PaymentContextType["paymentStatus"]>(
    "idle"
  )
  const [orderId, setOrderId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [creditsAdded, setCreditsAdded] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Initialize services with stable reference
  // useMemo ensures orchestrator is only created once
  // [C2] 如果没有注入 apiService，则创建默认实现
  const orchestrator = useMemo(() => {
    const api = apiService || createDefaultPaymentApiService()
    return new PaymentOrchestrator(
      new CrossmintService(),
      api
    )
  }, [apiService])

  const selectPackage = useCallback((packageId: string) => {
    const pkg = getPackage(packageId)
    if (pkg) {
      setSelectedPackage(pkg)
      setError(null)
    } else {
      setError("Invalid package ID")
    }
  }, [])

  const initiatePayment = useCallback(
    async (packageId: string) => {
      setPaymentStatus("loading")
      setError(null)
      setSessionId(null)

      try {
        const newSessionId = await orchestrator.createPaymentSession(packageId)
        setSessionId(newSessionId)
        console.log("[Payment] Checkout session created:", newSessionId)
        // Payment modal will display checkout using sessionId
      } catch (err) {
        const message = err instanceof Error ? err.message : "Payment initiation failed"
        setError(message)
        setPaymentStatus("error")
        orchestrator.handlePaymentError(err as Error)
      }
    },
    [orchestrator]
  )

  const handlePaymentSuccess = useCallback(
    async (crossmintOrderId: string) => {
      setPaymentStatus("loading")
      setError(null)

      try {
        const result = await orchestrator.handlePaymentSuccess(crossmintOrderId)
        setCreditsAdded(result.creditsAdded)
        setOrderId(result.order.id)
        setPaymentStatus("success")
      } catch (err) {
        const message = err instanceof Error ? err.message : "Payment confirmation failed"
        setError(message)
        setPaymentStatus("error")
        orchestrator.handlePaymentError(err as Error)
      }
    },
    [orchestrator]
  )

  const handlePaymentError = useCallback((errorMessage: string) => {
    setError(errorMessage)
    setPaymentStatus("error")
    orchestrator.handlePaymentError(errorMessage)
  }, [orchestrator])

  const resetPayment = useCallback(() => {
    setSelectedPackage(null)
    setPaymentStatus("idle")
    setOrderId(null)
    setSessionId(null)
    setCreditsAdded(0)
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value: PaymentContextType = {
    selectedPackage,
    paymentStatus,
    orderId,
    sessionId,
    creditsAdded,
    error,
    selectPackage,
    initiatePayment,
    handlePaymentSuccess,
    handlePaymentError,
    resetPayment,
    clearError,
  }

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  )
}

/**
 * Hook to use Payment Context
 * Must be called within PaymentProvider
 */
export function usePaymentContext(): PaymentContextType {
  const context = useContext(PaymentContext)
  if (!context) {
    throw new Error(
      "usePaymentContext must be used within PaymentProvider"
    )
  }
  return context
}
