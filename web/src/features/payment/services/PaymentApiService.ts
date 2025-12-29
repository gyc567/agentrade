/**
 * Payment API Service Interface
 * [C2] 抽象 HTTP 调用层，支持依赖注入和 mock 测试
 *
 * 优点：
 * - 分离关注点：PaymentOrchestrator 不再知道 HTTP 细节
 * - 易于测试：可以注入 mock 服务
 * - 易于扩展：可以创建不同的实现（SSR、离线等）
 * - 支持多种传输方式：REST、GraphQL 等
 */

import { ERROR_MESSAGES } from '../constants/errorCodes'
import { mapToBackendPackageId } from '../constants/packages'
import { paymentLogger } from '../utils/logger'
import type {
  PaymentConfirmResponse,
  CrossmintOrderRequest,
  CrossmintOrderResponse,
} from '../types/payment'

/**
 * Payment API 服务接口
 * 定义了所有与后端通信的 API 方法
 */
export interface PaymentApiService {
  /**
   * 创建 Crossmint 支付订单
   * 调用后端 API，后端再调用 Crossmint API 创建订单
   * @param packageId 套餐 ID
   * @returns Crossmint 订单信息（包含 orderId 和 clientSecret）
   */
  createCrossmintOrder(
    packageId: "starter" | "pro" | "vip"
  ): Promise<CrossmintOrderResponse>

  /**
   * 确认支付成功
   * @param orderId 订单 ID
   * @returns 支付确认响应
   */
  confirmPayment(orderId: string): Promise<PaymentConfirmResponse>

  /**
   * 获取用户支付历史
   * @param userId 用户 ID
   * @returns 订单列表
   */
  getPaymentHistory(userId: string): Promise<any[]>
}

/**
 * 默认 PaymentApiService 实现
 * 使用标准 fetch 调用后端 REST API
 */
export class DefaultPaymentApiService implements PaymentApiService {
  constructor(private getAuthToken?: () => string | null) {}

  /**
   * 创建 Crossmint 订单
   * KISS原则：简单的 HTTP POST 调用
   */
  async createCrossmintOrder(
    packageId: "starter" | "pro" | "vip"
  ): Promise<CrossmintOrderResponse> {
    if (!packageId) {
      throw new Error("Package ID is required")
    }

    try {
      // 将前端Package ID映射为后端数据库ID
      const backendPackageId = mapToBackendPackageId(packageId)

      const response = await fetch("/api/payments/crossmint/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getAuthToken?.() || ""}`,
        },
        body: JSON.stringify({
          packageId: backendPackageId,
        } as CrossmintOrderRequest),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(
          error.error || `Backend returned ${response.status}`
        )
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to create order")
      }

      return data as CrossmintOrderResponse
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create Crossmint order"
      paymentLogger.error("[CreateCrossmintOrder Error]", message)
      throw new Error(message)
    }
  }

  /**
   * 确认支付
   */
  async confirmPayment(orderId: string): Promise<PaymentConfirmResponse> {
    if (!orderId || typeof orderId !== 'string') {
      throw new Error(ERROR_MESSAGES.INVALID_ORDER || 'Invalid order ID')
    }

    try {
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken?.() || ''}`,
        },
        body: JSON.stringify({
          orderId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || ERROR_MESSAGES.INTERNAL_ERROR || 'Payment confirmation failed')
      }

      const data = await response.json()
      return data as PaymentConfirmResponse
    } catch (error) {
      const message =
        error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR || 'Unknown error'
      throw new Error(message)
    }
  }

  /**
   * 获取支付历史
   */
  async getPaymentHistory(userId: string): Promise<any[]> {
    if (!userId || typeof userId !== 'string') {
      throw new Error(ERROR_MESSAGES.INVALID_USER || 'Invalid user ID')
    }

    try {
      const response = await fetch(
        `/api/payments/history?userId=${encodeURIComponent(userId)}`,
        {
          headers: {
            'Authorization': `Bearer ${this.getAuthToken?.() || ''}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(ERROR_MESSAGES.INTERNAL_ERROR || 'Failed to fetch payment history')
      }

      const data = await response.json()
      return data.data?.orders || []
    } catch (error) {
      paymentLogger.error('[Payment History Error]', error)
      throw new Error(ERROR_MESSAGES.INTERNAL_ERROR || 'Failed to fetch payment history')
    }
  }
}

/**
 * 获取默认 PaymentApiService 实例
 * 这个工厂函数可以被其他服务或 Provider 使用
 */
export function createDefaultPaymentApiService(getAuthToken?: () => string | null): DefaultPaymentApiService {
  return new DefaultPaymentApiService(getAuthToken || (() => {
    // 如果没有提供 getAuthToken，默认从 localStorage 获取
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  }))
}
