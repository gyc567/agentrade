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
import { getPackage } from "../services/paymentValidator"
import { createDefaultPaymentApiService } from "../services/PaymentApiService"
import { paymentLogger } from "../utils/logger"
import type { PaymentContextType, PaymentPackage } from "../types/payment"
import type { PaymentApiService } from "../services/PaymentApiService"

interface PaymentProviderProps {
  children: React.ReactNode
  /**
   * 可选：注入自定义的 API 服务（用于测试）
   * 如果不提供，则使用默认实现
   */
  apiService?: PaymentApiService
  /**
   * 可选：支付成功后的回调函数
   * 用于刷新用户积分等操作
   */
  onPaymentSuccess?: (creditsAdded: number) => void
}

export function PaymentProvider({ children, apiService, onPaymentSuccess }: PaymentProviderProps) {
  const [selectedPackage, setSelectedPackage] = useState<PaymentPackage | null>(
    null
  )
  const [paymentStatus, setPaymentStatus] = useState<PaymentContextType["paymentStatus"]>(
    "idle"
  )
  const [orderId, setOrderId] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null) // @deprecated - kept for compatibility
  const [creditsAdded, setCreditsAdded] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Initialize services with stable reference
  // useMemo ensures orchestrator is only created once
  // [C2] 如果没有注入 apiService，则创建默认实现
  const orchestrator = useMemo(() => {
    const api = apiService || createDefaultPaymentApiService()
    return new PaymentOrchestrator(api)
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
      setOrderId(null)
      setClientSecret(null)
      setSessionId(null)

      try {
        // Get both orderId and clientSecret from backend
        const result = await orchestrator.createPaymentSession(packageId)
        setOrderId(result.orderId)
        setClientSecret(result.clientSecret)
        setSessionId(result.orderId) // @deprecated - for backward compatibility
        paymentLogger.debug("Payment", "Crossmint order created:", result.orderId)
        // Payment modal will display CrossmintCheckoutEmbed using orderId + clientSecret
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

        // 支付成功后触发回调（用于刷新用户积分）
        if (onPaymentSuccess) {
          onPaymentSuccess(result.creditsAdded)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Payment confirmation failed"
        setError(message)
        setPaymentStatus("error")
        orchestrator.handlePaymentError(err as Error)
      }
    },
    [orchestrator, onPaymentSuccess]
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
    setClientSecret(null)
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
    clientSecret,
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
