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
import type { PaymentConfirmResponse } from '../types/payment'

/**
 * Payment API 服务接口
 * 定义了所有与后端通信的 API 方法
 */
export interface PaymentApiService {
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
      console.error('[Payment History Error]', error)
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
