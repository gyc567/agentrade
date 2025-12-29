/**
 * PaymentOrchestrator Unit Tests
 * Tests for payment workflow orchestration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PaymentOrchestrator } from '../services/PaymentOrchestrator'
import type { PaymentApiService } from '../services/PaymentApiService'
import type { PaymentConfirmResponse } from '../types/payment'
import { ERROR_MESSAGES } from '../constants/errorCodes'

// Mock PaymentApiService
const createMockApiService = (): PaymentApiService => ({
  createCrossmintOrder: vi.fn(),
  confirmPayment: vi.fn(),
  getPaymentHistory: vi.fn(),
})

describe('PaymentOrchestrator', () => {
  let orchestrator: PaymentOrchestrator
  let mockApiService: ReturnType<typeof createMockApiService>

  beforeEach(() => {
    vi.clearAllMocks()
    mockApiService = createMockApiService()
    orchestrator = new PaymentOrchestrator(mockApiService)
  })

  describe('validatePackage', () => {
    it('returns package for valid package ID', () => {
      const result = orchestrator.validatePackage('starter')
      expect(result).not.toBeNull()
      expect(result?.id).toBe('starter')
    })

    it('returns null for invalid package ID', () => {
      const result = orchestrator.validatePackage('invalid')
      expect(result).toBeNull()
    })

    it('returns null for non-string input', () => {
      expect(orchestrator.validatePackage(null)).toBeNull()
      expect(orchestrator.validatePackage(undefined)).toBeNull()
      expect(orchestrator.validatePackage(123)).toBeNull()
    })
  })

  describe('validatePackageForPayment', () => {
    it('returns valid result for valid package ID', () => {
      const result = orchestrator.validatePackageForPayment('pro')
      expect(result.valid).toBe(true)
      if (result.valid) {
        expect(result.package.id).toBe('pro')
      }
    })

    it('returns invalid result for invalid package ID', () => {
      const result = orchestrator.validatePackageForPayment('nonexistent')
      expect(result.valid).toBe(false)
      if (!result.valid) {
        expect(result.error).toBeDefined()
      }
    })

    it('returns invalid result for empty string', () => {
      const result = orchestrator.validatePackageForPayment('')
      expect(result.valid).toBe(false)
    })
  })

  describe('validatePackageObject', () => {
    it('returns valid for complete package object', () => {
      const pkg = {
        id: 'test-pkg',
        name: 'Test Package',
        price: { amount: 10, currency: 'USDT' },
        credits: { amount: 100 },
      }
      const result = orchestrator.validatePackageObject(pkg)
      expect(result.valid).toBe(true)
    })

    it('returns invalid for missing id', () => {
      const pkg = {
        name: 'Test Package',
        price: { amount: 10 },
        credits: { amount: 100 },
      }
      const result = orchestrator.validatePackageObject(pkg)
      expect(result.valid).toBe(false)
    })

    it('returns invalid for missing price', () => {
      const pkg = {
        id: 'test',
        name: 'Test',
        credits: { amount: 100 },
      }
      const result = orchestrator.validatePackageObject(pkg)
      expect(result.valid).toBe(false)
    })

    it('returns invalid for invalid price amount', () => {
      const pkg = {
        id: 'test',
        name: 'Test',
        price: { amount: -10 },
        credits: { amount: 100 },
      }
      const result = orchestrator.validatePackageObject(pkg)
      expect(result.valid).toBe(false)
    })

    it('returns invalid for null input', () => {
      const result = orchestrator.validatePackageObject(null)
      expect(result.valid).toBe(false)
    })
  })

  describe('createPaymentSession', () => {
    it('creates payment session successfully', async () => {
      mockApiService.createCrossmintOrder = vi.fn().mockResolvedValue({
        success: true,
        orderId: 'order-123',
        clientSecret: 'secret-456',
      })

      const result = await orchestrator.createPaymentSession('starter')

      expect(result.orderId).toBe('order-123')
      expect(result.clientSecret).toBe('secret-456')
      expect(mockApiService.createCrossmintOrder).toHaveBeenCalledWith('starter')
    })

    it('throws error for invalid package', async () => {
      await expect(
        orchestrator.createPaymentSession('invalid-pkg')
      ).rejects.toThrow()
    })

    it('throws error when API returns failure', async () => {
      mockApiService.createCrossmintOrder = vi.fn().mockResolvedValue({
        success: false,
        error: 'API Error',
      })

      await expect(
        orchestrator.createPaymentSession('starter')
      ).rejects.toThrow()
    })

    it('throws error when API throws', async () => {
      mockApiService.createCrossmintOrder = vi.fn().mockRejectedValue(
        new Error('Network error')
      )

      await expect(
        orchestrator.createPaymentSession('starter')
      ).rejects.toThrow('Network error')
    })
  })

  describe('handlePaymentSuccess', () => {
    const mockConfirmResponse: PaymentConfirmResponse = {
      success: true,
      orderId: 'order-123',
      creditsAdded: 500,
      order: {
        id: 'order-123',
        userId: 'user-1',
        packageId: 'starter',
        status: 'completed',
      },
    }

    it('confirms payment successfully', async () => {
      mockApiService.confirmPayment = vi.fn().mockResolvedValue(mockConfirmResponse)

      const result = await orchestrator.handlePaymentSuccess('order-123')

      expect(result.success).toBe(true)
      expect(result.creditsAdded).toBe(500)
      expect(mockApiService.confirmPayment).toHaveBeenCalledWith('order-123')
    })

    it('throws error for invalid order ID', async () => {
      await expect(
        orchestrator.handlePaymentSuccess('')
      ).rejects.toThrow(ERROR_MESSAGES.INVALID_ORDER)
    })

    it('throws error for non-string order ID', async () => {
      await expect(
        orchestrator.handlePaymentSuccess(null as unknown as string)
      ).rejects.toThrow(ERROR_MESSAGES.INVALID_ORDER)
    })

    it('propagates API errors', async () => {
      mockApiService.confirmPayment = vi.fn().mockRejectedValue(
        new Error('Confirmation failed')
      )

      await expect(
        orchestrator.handlePaymentSuccess('order-123')
      ).rejects.toThrow('Confirmation failed')
    })
  })

  describe('handlePaymentError', () => {
    it('handles Error object', () => {
      const error = new Error('Test error')
      // Should not throw
      expect(() => orchestrator.handlePaymentError(error)).not.toThrow()
    })

    it('handles string error', () => {
      expect(() => orchestrator.handlePaymentError('String error')).not.toThrow()
    })

    it('calls global error callback if defined', () => {
      const mockCallback = vi.fn()
      window.__paymentErrorCallback = mockCallback

      orchestrator.handlePaymentError('Test error')

      expect(mockCallback).toHaveBeenCalledWith('Test error')

      delete window.__paymentErrorCallback
    })
  })

  describe('getPaymentHistory', () => {
    it('fetches payment history successfully', async () => {
      const mockHistory = [
        { id: 'order-1', status: 'completed' },
        { id: 'order-2', status: 'pending' },
      ]
      mockApiService.getPaymentHistory = vi.fn().mockResolvedValue(mockHistory)

      const result = await orchestrator.getPaymentHistory('user-123')

      expect(result).toEqual(mockHistory)
      expect(mockApiService.getPaymentHistory).toHaveBeenCalledWith('user-123')
    })

    it('throws error for invalid user ID', async () => {
      await expect(
        orchestrator.getPaymentHistory('')
      ).rejects.toThrow(ERROR_MESSAGES.INVALID_USER)
    })

    it('throws internal error on API failure', async () => {
      mockApiService.getPaymentHistory = vi.fn().mockRejectedValue(
        new Error('API Error')
      )

      await expect(
        orchestrator.getPaymentHistory('user-123')
      ).rejects.toThrow(ERROR_MESSAGES.INTERNAL_ERROR)
    })
  })

  describe('retryPaymentConfirmation', () => {
    it('succeeds on first attempt', async () => {
      const mockResponse: PaymentConfirmResponse = {
        success: true,
        orderId: 'order-123',
        creditsAdded: 500,
        order: { id: 'order-123', userId: 'u1', packageId: 'starter', status: 'completed' },
      }
      mockApiService.confirmPayment = vi.fn().mockResolvedValue(mockResponse)

      const result = await orchestrator.retryPaymentConfirmation('order-123')

      expect(result?.success).toBe(true)
      expect(mockApiService.confirmPayment).toHaveBeenCalledTimes(1)
    })

    it('retries on failure and eventually succeeds', async () => {
      const mockResponse: PaymentConfirmResponse = {
        success: true,
        orderId: 'order-123',
        creditsAdded: 500,
        order: { id: 'order-123', userId: 'u1', packageId: 'starter', status: 'completed' },
      }

      mockApiService.confirmPayment = vi.fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue(mockResponse)

      const result = await orchestrator.retryPaymentConfirmation('order-123', 3)

      expect(result?.success).toBe(true)
      expect(mockApiService.confirmPayment).toHaveBeenCalledTimes(3)
    })

    it('throws after max retries exceeded', async () => {
      mockApiService.confirmPayment = vi.fn().mockRejectedValue(
        new Error('Persistent failure')
      )

      await expect(
        orchestrator.retryPaymentConfirmation('order-123', 2)
      ).rejects.toThrow(ERROR_MESSAGES.PAYMENT_TIMEOUT)
    })
  })
})
