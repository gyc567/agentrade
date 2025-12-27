/**
 * useCrossmintCheckout Hook
 * Manages Crossmint Hosted Checkout lifecycle
 */

import { useCallback } from "react"
import { usePaymentContext } from "../contexts/PaymentProvider"
import type { CrossmintEvent } from "../types/payment"

interface UseCrossmintCheckoutReturn {
  initCheckout: (packageId: string) => Promise<void>
  handleCheckoutEvent: (event: CrossmintEvent) => void
  status: string
  error: string | null
  orderId: string | null
  creditsAdded: number
}

export function useCrossmintCheckout(): UseCrossmintCheckoutReturn {
  const context = usePaymentContext()

  const initCheckout = useCallback(
    async (packageId: string) => {
      await context.initiatePayment(packageId)
    },
    [context]
  )

  const handleCheckoutEvent = useCallback(
    (event: CrossmintEvent) => {
      if (!event || !event.type) {
        return
      }

      switch (event.type) {
        case "checkout:order.paid":
          context.handlePaymentSuccess(event.payload.orderId)
          break

        case "checkout:order.failed":
          context.handlePaymentError(
            event.payload.error || "Payment failed"
          )
          break

        case "checkout:order.cancelled":
          context.resetPayment()
          break

        default:
          console.log("[Crossmint Event]", event.type)
      }
    },
    [context]
  )

  return {
    initCheckout,
    handleCheckoutEvent,
    status: context.paymentStatus,
    error: context.error,
    orderId: context.orderId,
    creditsAdded: context.creditsAdded,
  }
}
