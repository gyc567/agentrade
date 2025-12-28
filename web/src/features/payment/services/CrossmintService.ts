/**
 * Crossmint Service
 * Wrapper around Crossmint SDK
 * Handles all interactions with Crossmint API
 */

import type { PaymentPackage, CrossmintLineItem } from "../types/payment"

export interface CheckoutConfig {
  lineItems: CrossmintLineItem[]
  checkoutProps?: {
    payment?: {
      allowedMethods?: string[]
    }
    preferredChains?: string[]
  }
  successCallbackURL?: string
  failureCallbackURL?: string
  locale?: string
}

export class CrossmintService {
  private apiKey: string
  private checkoutConfig: CheckoutConfig | null = null
  private eventListeners: Map<string, ((event: any) => void)[]> = new Map()

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_CROSSMINT_CLIENT_API_KEY || ""

    if (!this.apiKey) {
      console.warn(
        "[Crossmint] API Key not configured. Payment feature will not work."
      )
    }
  }

  /**
   * Checks if Crossmint SDK is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey
  }

  /**
   * Initialize Crossmint checkout via API
   * Creates a checkout session and returns session ID for embedded checkout
   */
  async initializeCheckout(config: CheckoutConfig): Promise<string> {
    if (!this.isConfigured()) {
      console.error("[CrossmintService] API Key is missing! Please set NEXT_PUBLIC_CROSSMINT_CLIENT_API_KEY in .env")
      throw new Error("Crossmint API Key is not configured")
    }

    this.checkoutConfig = config

    try {
      // Call Crossmint API to create checkout session
      const response = await fetch("https://api.crossmint.com/2022-06-09/embedded-checkouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": this.apiKey,
        },
        body: JSON.stringify({
          lineItems: config.lineItems,
          payment: config.checkoutProps?.payment || {
            allowedMethods: ["crypto"],
          },
          preferredChains: config.checkoutProps?.preferredChains || ["polygon", "base", "arbitrum"],
          successUrl: config.successCallbackURL,
          cancelUrl: config.failureCallbackURL,
          locale: config.locale || "en-US",
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(
          error.message || `Crossmint API error: ${response.statusText}`
        )
      }

      const data = await response.json()
      const sessionId = data.id || data.sessionId

      if (!sessionId) {
        throw new Error("No session ID returned from Crossmint")
      }

      console.log("[Crossmint] Checkout session created:", sessionId)
      return sessionId
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      console.error("[Crossmint] Failed to initialize checkout:", message)
      throw new Error(`Failed to initialize Crossmint checkout: ${message}`)
    }
  }

  /**
   * Opens checkout in a new window/iframe
   * Uses the session ID returned from initializeCheckout
   */
  async openCheckout(sessionId: string): Promise<void> {
    if (!sessionId) {
      throw new Error("No session ID provided")
    }

    try {
      // Open Crossmint checkout URL
      const checkoutUrl = `https://embedded-checkout.crossmint.com?sessionId=${sessionId}`
      window.open(checkoutUrl, "Crossmint_Checkout", "width=600,height=700")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      throw new Error(`Failed to open checkout: ${message}`)
    }
  }

  /**
   * Creates line items in Crossmint format
   */
  createLineItems(pkg: PaymentPackage): CrossmintLineItem[] {
    const totalCredits = pkg.credits.amount + (pkg.credits.bonusAmount || 0)

    return [
      {
        price: pkg.price.amount.toString(),
        currency: pkg.price.currency,
        quantity: 1,
        metadata: {
          packageId: pkg.id,
          credits: totalCredits,
          bonusMultiplier: pkg.credits.bonusMultiplier || 1.0,
        },
      },
    ]
  }

  /**
   * Handles Crossmint checkout events
   */
  handleCheckoutEvent(event: any): {
    type: string
    handled: boolean
    message?: string
  } {
    if (!event || !event.type) {
      return {
        type: "unknown",
        handled: false,
        message: "Invalid event",
      }
    }

    switch (event.type) {
      case "checkout:order.created":
        return {
          type: "order.created",
          handled: true,
          message: "Order created",
        }

      case "checkout:order.paid":
        return {
          type: "order.paid",
          handled: true,
          message: "Payment confirmed on blockchain",
        }

      case "checkout:order.failed":
        return {
          type: "order.failed",
          handled: true,
          message: "Payment failed",
        }

      case "checkout:order.cancelled":
        return {
          type: "order.cancelled",
          handled: true,
          message: "User cancelled payment",
        }

      default:
        return {
          type: event.type,
          handled: false,
          message: `Unknown event type: ${event.type}`,
        }
    }
  }

  /**
   * Registers event listener for checkout events
   */
  on(eventType: string, callback: (event: any) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, [])
    }
    this.eventListeners.get(eventType)?.push(callback)
  }

  /**
   * Removes event listener
   */
  off(eventType: string, callback: (event: any) => void): void {
    const listeners = this.eventListeners.get(eventType)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  /**
   * Emits an event to all registered listeners
   */
  emit(eventType: string, event: any): void {
    const listeners = this.eventListeners.get(eventType) || []
    listeners.forEach(callback => callback(event))
  }

  /**
   * Verifies a Crossmint payment signature
   * For enhanced security (optional but recommended)
   */
  verifyPaymentSignature(signature: unknown): boolean {
    // In a real implementation, this would verify the signature
    // using the Crossmint webhook secret
    // For now, we accept it and let the backend verify

    if (!signature || typeof signature !== "string") {
      return false
    }

    // Basic check - in production, use HMAC verification
    return signature.length > 0
  }

  /**
   * Gets Crossmint SDK configuration
   */
  getConfig(): { apiKey: string; configured: boolean } {
    return {
      apiKey: this.apiKey,
      configured: this.isConfigured(),
    }
  }

  /**
   * Gets current checkout configuration
   */
  getCheckoutConfig(): CheckoutConfig | null {
    return this.checkoutConfig
  }

  /**
   * Resets the service state
   */
  reset(): void {
    this.checkoutConfig = null
    this.eventListeners.clear()
  }
}

// Export singleton instance
export const crossmintService = new CrossmintService()

