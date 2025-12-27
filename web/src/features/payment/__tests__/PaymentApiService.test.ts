/**
 * Payment API Service 测试套件
 * 测试：API 调用、错误处理、auth token 管理
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DefaultPaymentApiService, createDefaultPaymentApiService } from '../services/PaymentApiService'
import type { PaymentConfirmResponse } from '../types/payment'

// Mock fetch
global.fetch = vi.fn()

describe('PaymentApiService [C2 依赖注入验证]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('confirmPayment', () => {
    it('应该以正确的参数调用 /api/payments/confirm 端点', async () => {
      const mockResponse: PaymentConfirmResponse = {
        success: true,
        orderId: 'order-123',
        creditsAdded: 500,
        order: { id: 'order-123', userId: 'user-456', packageId: 'starter', status: 'completed' }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const service = new DefaultPaymentApiService(() => 'test-token')
      const result = await service.confirmPayment('order-123')

      expect(global.fetch).toHaveBeenCalled()
      const callArgs = (global.fetch as any).mock.calls[0]
      expect(callArgs[0]).toBe('/api/payments/confirm')
      expect(callArgs[1]).toMatchObject({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        })
      })

      expect(result).toEqual(mockResponse)
    })

    it('应该处理 HTTP 错误响应', async () => {
      const errorResponse = { error: 'Payment confirmation failed' }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse
      })

      const service = new DefaultPaymentApiService(() => 'test-token')

      await expect(service.confirmPayment('invalid-order')).rejects.toThrow('Payment confirmation failed')
    })

    it('应该处理网络错误', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const service = new DefaultPaymentApiService(() => 'test-token')

      await expect(service.confirmPayment('order-123')).rejects.toThrow('Network error')
    })

    it('应该验证 orderId 参数', async () => {
      const service = new DefaultPaymentApiService(() => 'test-token')

      await expect(service.confirmPayment('')).rejects.toThrow()
      await expect(service.confirmPayment(null as any)).rejects.toThrow()
      await expect(service.confirmPayment(undefined as any)).rejects.toThrow()
    })

    it('应该处理没有 auth token 的情况', async () => {
      const mockResponse: PaymentConfirmResponse = {
        success: true,
        orderId: 'order-123',
        creditsAdded: 500,
        order: { id: 'order-123', userId: 'user-456', packageId: 'starter', status: 'completed' }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const service = new DefaultPaymentApiService(() => null)
      await service.confirmPayment('order-123')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/payments/confirm',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer '
          })
        })
      )
    })

    it('应该处理默认 getAuthToken (来自 localStorage)', async () => {
      const mockResponse: PaymentConfirmResponse = {
        success: true,
        orderId: 'order-123',
        creditsAdded: 500,
        order: { id: 'order-123', userId: 'user-456', packageId: 'starter', status: 'completed' }
      }

      localStorage.setItem('auth_token', 'local-storage-token')

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      // 不提供 getAuthToken，应该从 localStorage 获取
      const service = new DefaultPaymentApiService()
      await service.confirmPayment('order-123')

      expect(global.fetch).toHaveBeenCalled()
      const callArgs = (global.fetch as any).mock.calls[0]
      expect(callArgs[0]).toBe('/api/payments/confirm')
      expect(callArgs[1]).toMatchObject({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    })
  })

  describe('getPaymentHistory', () => {
    it('应该以正确的参数调用 /api/payments/history 端点', async () => {
      const mockOrders = [
        { id: 'order-1', packageId: 'starter', creditsAdded: 500 },
        { id: 'order-2', packageId: 'pro', creditsAdded: 3000 }
      ]

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { orders: mockOrders } })
      })

      const service = new DefaultPaymentApiService(() => 'test-token')
      const result = await service.getPaymentHistory('user-123')

      expect(global.fetch).toHaveBeenCalled()
      const callArgs = (global.fetch as any).mock.calls[0]
      expect(callArgs[0]).toBe('/api/payments/history?userId=user-123')
      expect(callArgs[1]).toMatchObject({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        })
      })

      expect(result).toEqual(mockOrders)
    })

    it('应该正确编码 userId 参数', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { orders: [] } })
      })

      const service = new DefaultPaymentApiService(() => 'test-token')
      await service.getPaymentHistory('user@example.com')

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/payments/history?userId=user%40example.com',
        expect.anything()
      )
    })

    it('应该处理空订单列表', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { orders: null } })
      })

      const service = new DefaultPaymentApiService(() => 'test-token')
      const result = await service.getPaymentHistory('user-123')

      expect(result).toEqual([])
    })

    it('应该处理 HTTP 错误响应', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      const service = new DefaultPaymentApiService(() => 'test-token')

      await expect(service.getPaymentHistory('user-123')).rejects.toThrow()
    })

    it('应该处理网络错误', async () => {
      ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

      const service = new DefaultPaymentApiService(() => 'test-token')

      await expect(service.getPaymentHistory('user-123')).rejects.toThrow()
    })

    it('应该验证 userId 参数', async () => {
      const service = new DefaultPaymentApiService(() => 'test-token')

      await expect(service.getPaymentHistory('')).rejects.toThrow()
      await expect(service.getPaymentHistory(null as any)).rejects.toThrow()
      await expect(service.getPaymentHistory(undefined as any)).rejects.toThrow()
    })

    it('应该处理 JSON 解析错误', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON')
        }
      })

      const service = new DefaultPaymentApiService(() => 'test-token')

      await expect(service.getPaymentHistory('user-123')).rejects.toThrow()
    })
  })

  describe('createDefaultPaymentApiService 工厂函数', () => {
    it('应该创建 DefaultPaymentApiService 实例', () => {
      const service = createDefaultPaymentApiService()
      expect(service).toBeInstanceOf(DefaultPaymentApiService)
    })

    it('应该使用提供的 getAuthToken 函数', async () => {
      const mockResponse: PaymentConfirmResponse = {
        success: true,
        orderId: 'order-123',
        creditsAdded: 500,
        order: { id: 'order-123', userId: 'user-456', packageId: 'starter', status: 'completed' }
      }

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const mockGetToken = vi.fn(() => 'factory-token')
      const service = createDefaultPaymentApiService(mockGetToken)

      await service.confirmPayment('order-123')

      expect(mockGetToken).toHaveBeenCalled()
      expect(global.fetch).toHaveBeenCalled()
      const callArgs = (global.fetch as any).mock.calls[0]
      expect(callArgs[1]).toMatchObject({
        headers: expect.objectContaining({
          'Authorization': 'Bearer factory-token'
        })
      })
    })

    it('应该使用 localStorage 作为默认的 token 源', async () => {
      localStorage.setItem('auth_token', 'default-token')

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { orders: [] } })
      })

      const service = createDefaultPaymentApiService()
      await service.getPaymentHistory('user-123')

      expect(global.fetch).toHaveBeenCalled()
      const callArgs = (global.fetch as any).mock.calls[0]
      expect(callArgs[1]).toMatchObject({
        headers: expect.objectContaining({
          'Authorization': 'Bearer default-token'
        })
      })
    })
  })

  describe('集成测试 [C2 分离验证]', () => {
    it('应该支持多个并发请求', async () => {
      const mockResponse: PaymentConfirmResponse = {
        success: true,
        orderId: 'order-123',
        creditsAdded: 500,
        order: { id: 'order-123', userId: 'user-456', packageId: 'starter', status: 'completed' }
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })

      const service = new DefaultPaymentApiService(() => 'test-token')

      const results = await Promise.all([
        service.confirmPayment('order-1'),
        service.confirmPayment('order-2'),
        service.confirmPayment('order-3')
      ])

      expect(results).toHaveLength(3)
      expect(global.fetch).toHaveBeenCalledTimes(3)
    })

    it('应该保持 API 调用的独立性', async () => {
      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { orders: [{ id: 'order-1' }] } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, orderId: 'order-2', creditsAdded: 500, order: { id: 'order-2', userId: 'user-456', packageId: 'starter', status: 'completed' } })
        })

      const service = new DefaultPaymentApiService(() => 'test-token')

      const history = await service.getPaymentHistory('user-123')
      const confirmation = await service.confirmPayment('order-2')

      expect(history).toEqual([{ id: 'order-1' }])
      expect(confirmation.orderId).toBe('order-2')
    })
  })
})
