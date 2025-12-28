/**
 * Payment Orchestrator Service
 * Orchestrates the payment workflow
 * Implements the main business logic for payment processing
 *
 * [C2] 依赖注入：接收 PaymentApiService 而不是直接调用 fetch
 * 优点：
 * - 与 HTTP 客户端解耦
 * - 易于测试（可以注入 mock 服务）
 * - 支持多种 API 实现
 */

import { getPackage, validatePackageForPayment } from "./paymentValidator"
import type { PaymentPackage, PaymentConfirmResponse } from "../types/payment"
import type { PaymentApiService } from "./PaymentApiService"
import { ERROR_MESSAGES } from "../constants/errorCodes"

export class PaymentOrchestrator {
  constructor(
    _crossmintService: any, // @deprecated - No longer used, kept for backward compatibility
    private apiService: PaymentApiService
  ) {
    // _crossmintService is no longer used in the new implementation
    // All Crossmint API calls go through backend API now
    // Not stored as class property to avoid unused warning
  }

  /**
   * Validates and retrieves a payment package
   */
  validatePackage(packageId: unknown): PaymentPackage | null {
    return getPackage(packageId)
  }

  /**
   * Validates a package and returns detailed result
   * Accepts both hardcoded and dynamic packages from backend
   */
  validatePackageForPayment(packageId: unknown) {
    return validatePackageForPayment(packageId)
  }

  /**
   * Validates a complete package object (for dynamic packages from API)
   */
  validatePackageObject(pkg: unknown): { valid: true } | { valid: false; error: string } {
    if (!pkg || typeof pkg !== "object") {
      return {
        valid: false,
        error: "Package must be an object",
      }
    }

    const p = pkg as Record<string, unknown>

    // Validate required fields
    if (!p.id || typeof p.id !== "string") {
      return { valid: false, error: "Invalid package ID" }
    }

    if (!p.name || typeof p.name !== "string") {
      return { valid: false, error: "Invalid package name" }
    }

    // Validate price structure
    if (!p.price || typeof p.price !== "object") {
      return { valid: false, error: "Invalid price structure" }
    }

    const price = p.price as Record<string, unknown>
    if (typeof price.amount !== "number" || price.amount <= 0) {
      return { valid: false, error: "Invalid price amount" }
    }

    // Validate credits structure
    if (!p.credits || typeof p.credits !== "object") {
      return { valid: false, error: "Invalid credits structure" }
    }

    const credits = p.credits as Record<string, unknown>
    if (typeof credits.amount !== "number" || credits.amount <= 0) {
      return { valid: false, error: "Invalid credits amount" }
    }

    return { valid: true }
  }

  /**
   * Creates a payment session with Crossmint
   *
   * New implementation: Uses backend API instead of direct Crossmint calls
   * Backend handles Crossmint API integration securely with server-side key
   *
   * @param packageId Package ID (starter/pro/vip)
   * @returns Order ID from Crossmint (not session ID anymore)
   */
  async createPaymentSession(packageId: string): Promise<string> {
    // Validate package
    const validation = this.validatePackageForPayment(packageId)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    try {
      // Call backend API to create Crossmint order
      // Backend will call Crossmint API with server-side key
      const response = await this.apiService.createCrossmintOrder(
        packageId as "starter" | "pro" | "vip"
      )

      if (!response.success || !response.orderId) {
        throw new Error(response.error || "Failed to create order")
      }

      console.log("[PaymentOrchestrator] Order created:", response.orderId)

      // Return orderId (will be used by frontend to display checkout)
      return response.orderId
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      console.error("[PaymentOrchestrator] Failed to create order:", message)
      console.error("[PaymentOrchestrator] Detailed Error:", error)
      throw new Error(
        `${ERROR_MESSAGES.CROSSMINT_ERROR}: ${message}`
      )
    }
  }

  /**
   * Handles successful payment confirmation
   * [C2] 使用注入的 apiService 替代直接 fetch
   */
  async handlePaymentSuccess(orderId: string): Promise<PaymentConfirmResponse> {
    if (!orderId || typeof orderId !== "string") {
      throw new Error(ERROR_MESSAGES.INVALID_ORDER)
    }

    try {
      // 委托给注入的 API 服务处理实际的 HTTP 调用
      return await this.apiService.confirmPayment(orderId)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
      throw new Error(message)
    }
  }

  /**
   * Handles payment error
   */
  handlePaymentError(error: Error | string): void {
    const errorMessage =
      typeof error === "string" ? error : error.message

    console.error("[Payment Error]", errorMessage)

    // Could emit events or trigger monitoring here
    if (typeof window !== "undefined" && window.__paymentErrorCallback) {
      ;(window as any).__paymentErrorCallback(errorMessage)
    }
  }

  /**
   * Retrieves payment history for a user
   * [C2] 使用注入的 apiService 替代直接 fetch
   */
  async getPaymentHistory(userId: string): Promise<any[]> {
    if (!userId || typeof userId !== "string") {
      throw new Error(ERROR_MESSAGES.INVALID_USER)
    }

    try {
      // 委托给注入的 API 服务处理实际的 HTTP 调用
      return await this.apiService.getPaymentHistory(userId)
    } catch (error) {
      console.error("[Payment History Error]", error)
      throw new Error(ERROR_MESSAGES.INTERNAL_ERROR)
    }
  }

  /**
   * Retries a failed payment confirmation
   */
  async retryPaymentConfirmation(
    orderId: string,
    maxRetries: number = 3
  ): Promise<PaymentConfirmResponse | null> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await this.handlePaymentSuccess(orderId)
      } catch (error) {
        lastError = error as Error
        if (attempt < maxRetries - 1) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt) * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw new Error(
      `${ERROR_MESSAGES.PAYMENT_TIMEOUT}: ${lastError?.message}`
    )
  }
}

// Global error callback hook
declare global {
  interface Window {
    __paymentErrorCallback?: (error: string) => void
  }
}