/**
 * Crossmint Checkout Embed Component
 * Simple wrapper for Crossmint SDK embedded checkout
 *
 * Design: KISS - Keep It Simple, Stupid
 * - Single responsibility: Display Crossmint checkout iframe
 * - Minimal dependencies: Only React and Crossmint SDK
 * - Clean props: orderId + clientSecret
 * - Event handling: Via backend webhooks (not frontend events)
 *
 * IMPORTANT: When using existing orderId, Crossmint SDK does NOT support onEvent callbacks.
 * Payment status updates must be handled via:
 * 1. Backend webhooks (POST /api/webhooks/crossmint) - source of truth
 * 2. Frontend polling or WebSocket to check order status
 */

import { CrossmintEmbeddedCheckout } from "@crossmint/client-sdk-react-ui"

interface CrossmintCheckoutEmbedProps {
  /** Order ID from backend (returned after createOrder) */
  orderId: string

  /** Client secret from backend */
  clientSecret: string
}

/**
 * Crossmint Embedded Checkout Component
 *
 * Uses official Crossmint SDK with orderId (created by backend)
 * Backend has already created the order with Crossmint API
 *
 * Event Flow:
 * 1. User completes payment in Crossmint iframe
 * 2. Crossmint sends webhook to backend (POST /api/webhooks/crossmint)
 * 3. Backend verifies payment and updates order status
 * 4. Frontend polls backend or receives WebSocket notification
 * 5. Frontend shows success/error message based on order status
 */
export function CrossmintCheckoutEmbed({
  orderId,
  clientSecret,
}: CrossmintCheckoutEmbedProps) {
  return (
    <div className="crossmint-checkout-container">
      <CrossmintEmbeddedCheckout
        // Use existing order created by backend
        orderId={orderId}
        clientSecret={clientSecret}
        // Payment methods configured by backend when creating order
        payment={{
          crypto: {
            enabled: true,
          },
          fiat: {
            enabled: true,
          },
        }}
      />
    </div>
  )
}
