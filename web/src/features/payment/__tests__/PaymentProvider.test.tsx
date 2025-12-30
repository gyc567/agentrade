/**
 * PaymentProvider Tests
 * Tests for onPaymentSuccess callback integration
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import React from "react"
import { PaymentProvider, usePaymentContext } from "../contexts/PaymentProvider"
import type { PaymentApiService } from "../services/PaymentApiService"

// Test component that uses payment context
function TestConsumer({ onContextReady }: { onContextReady?: (ctx: ReturnType<typeof usePaymentContext>) => void }) {
  const context = usePaymentContext()
  React.useEffect(() => {
    onContextReady?.(context)
  }, [context, onContextReady])
  return <div data-testid="test-consumer">Consumer</div>
}

describe("PaymentProvider", () => {
  let mockApiService: PaymentApiService

  beforeEach(() => {
    mockApiService = {
      createCrossmintOrder: vi.fn(),
      confirmPayment: vi.fn(),
      getPaymentHistory: vi.fn(),
    }
  })

  describe("onPaymentSuccess callback", () => {
    it("should call onPaymentSuccess when payment is successful", async () => {
      const onPaymentSuccess = vi.fn()
      const mockCreditsAdded = 500

      // Mock successful payment confirmation
      mockApiService.confirmPayment = vi.fn().mockResolvedValue({
        success: true,
        creditsAdded: mockCreditsAdded,
        order: {
          id: "order-123",
          status: "completed",
        },
      })

      let capturedContext: ReturnType<typeof usePaymentContext> | null = null

      render(
        <PaymentProvider apiService={mockApiService} onPaymentSuccess={onPaymentSuccess}>
          <TestConsumer onContextReady={(ctx) => { capturedContext = ctx }} />
        </PaymentProvider>
      )

      // Wait for context to be available
      await waitFor(() => {
        expect(capturedContext).not.toBeNull()
      })

      // Trigger payment success
      await capturedContext!.handlePaymentSuccess("crossmint-order-123")

      // Verify callback was called with credits added
      await waitFor(() => {
        expect(onPaymentSuccess).toHaveBeenCalledTimes(1)
        expect(onPaymentSuccess).toHaveBeenCalledWith(mockCreditsAdded)
      })
    })

    it("should not call onPaymentSuccess when payment fails", async () => {
      const onPaymentSuccess = vi.fn()

      // Mock failed payment confirmation
      mockApiService.confirmPayment = vi.fn().mockRejectedValue(new Error("Payment failed"))

      let capturedContext: ReturnType<typeof usePaymentContext> | null = null

      render(
        <PaymentProvider apiService={mockApiService} onPaymentSuccess={onPaymentSuccess}>
          <TestConsumer onContextReady={(ctx) => { capturedContext = ctx }} />
        </PaymentProvider>
      )

      // Wait for context to be available
      await waitFor(() => {
        expect(capturedContext).not.toBeNull()
      })

      // Trigger payment success (which will fail)
      try {
        await capturedContext!.handlePaymentSuccess("crossmint-order-123")
      } catch {
        // Expected to fail
      }

      // Verify callback was NOT called
      expect(onPaymentSuccess).not.toHaveBeenCalled()
    })

    it("should work without onPaymentSuccess callback", async () => {
      // Mock successful payment confirmation
      mockApiService.confirmPayment = vi.fn().mockResolvedValue({
        success: true,
        creditsAdded: 500,
        order: {
          id: "order-123",
          status: "completed",
        },
      })

      let capturedContext: ReturnType<typeof usePaymentContext> | null = null

      // No onPaymentSuccess callback provided
      render(
        <PaymentProvider apiService={mockApiService}>
          <TestConsumer onContextReady={(ctx) => { capturedContext = ctx }} />
        </PaymentProvider>
      )

      // Wait for context to be available
      await waitFor(() => {
        expect(capturedContext).not.toBeNull()
      })

      // Should not throw when payment succeeds without callback
      await expect(capturedContext!.handlePaymentSuccess("crossmint-order-123")).resolves.not.toThrow()
    })
  })

  describe("context values", () => {
    it("should provide initial context values", async () => {
      let capturedContext: ReturnType<typeof usePaymentContext> | null = null

      render(
        <PaymentProvider apiService={mockApiService}>
          <TestConsumer onContextReady={(ctx) => { capturedContext = ctx }} />
        </PaymentProvider>
      )

      await waitFor(() => {
        expect(capturedContext).not.toBeNull()
      })

      expect(capturedContext!.selectedPackage).toBeNull()
      expect(capturedContext!.paymentStatus).toBe("idle")
      expect(capturedContext!.orderId).toBeNull()
      expect(capturedContext!.clientSecret).toBeNull()
      expect(capturedContext!.creditsAdded).toBe(0)
      expect(capturedContext!.error).toBeNull()
    })
  })
})
