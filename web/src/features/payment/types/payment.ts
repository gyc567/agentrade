/**
 * Payment Feature - Core Type Definitions
 * Domain models for payment functionality
 */

// ====== VALUE OBJECTS ======

export interface PaymentPackage {
  id: string
  name: string
  description: string
  price: {
    amount: number
    currency: "USDT"
    chainPreference?: string
  }
  credits: {
    amount: number
    bonusMultiplier?: number
    bonusAmount?: number
  }
  badge?: string
  highlightColor?: string
  isActive?: boolean
  availableFrom?: Date
  availableUntil?: Date
  metadata?: Record<string, any>
}

// ====== AGGREGATES ======

export interface PaymentOrder {
  id: string
  crossmintOrderId: string
  userId: string
  packageId: "starter" | "pro" | "vip"
  packageSnapshot: {
    name: string
    credits: number
    bonusCredits: number
    totalCredits: number
  }
  payment: {
    amount: number
    currency: "USDT"
    chainUsed?: string
    transactionHash?: string
    confirmations?: number
  }
  status: "pending" | "paid" | "completed" | "failed" | "cancelled"
  statusHistory: Array<{
    status: string
    timestamp: Date
    reason?: string
  }>
  createdAt: Date
  paidAt?: Date
  completedAt?: Date
  credits: {
    baseCredits: number
    bonusCredits: number
    totalCredits: number
    addedToUserAt?: Date
  }
  verification: {
    signature?: string
    verified: boolean
    verifiedAt?: Date
  }
  metadata?: any
  retryCount: number
  errors?: Array<{
    code: string
    message: string
    timestamp: Date
  }>
}

// ====== EVENTS ======

export type PaymentEventType =
  | "payment.initialized"
  | "payment.pending"
  | "payment.confirmed"
  | "payment.failed"
  | "payment.cancelled"
  | "credits.added"
  | "credits.additionFailed"

export interface PaymentEvent {
  type: PaymentEventType
  orderId: string
  userId: string
  timestamp: Date
  payload: {
    packageId?: string
    amount?: number
    credits?: number
    reason?: string
    error?: {
      code: string
      message: string
    }
  }
  metadata?: {
    version: string
    source: "frontend" | "backend" | "webhook"
  }
}

// ====== CONTEXT ======

export interface PaymentContextType {
  selectedPackage: PaymentPackage | null
  paymentStatus: "idle" | "loading" | "success" | "error"
  orderId: string | null
  sessionId: string | null
  creditsAdded: number
  error: string | null
  selectPackage: (packageId: string) => void
  initiatePayment: (packageId: string) => Promise<void>
  handlePaymentSuccess: (crossmintOrderId: string) => Promise<void>
  handlePaymentError: (errorMessage: string) => void
  resetPayment: () => void
  clearError: () => void
}

// ====== API TYPES ======

export interface PaymentConfirmRequest {
  orderId: string
  signature?: string
  packageId: string
}

export interface PaymentConfirmResponse {
  success: boolean
  message: string
  creditsAdded: number
  bonusCredits: number
  totalCredits: number
  order: {
    id: string
    status: "completed"
    paidAt: Date
    completedAt: Date
  }
}

/**
 * Crossmint Order Creation Request
 */
export interface CrossmintOrderRequest {
  packageId: "starter" | "pro" | "vip"
}

/**
 * Crossmint Order Creation Response
 * Returned by backend after creating order with Crossmint API
 */
export interface CrossmintOrderResponse {
  success: boolean
  orderId: string
  clientSecret: string
  amount: number
  currency: string
  credits: number
  expiresAt?: string
  error?: string
  code?: string
}

export interface PaymentErrorResponse {
  success: false
  error: string
  code: string
  details?: {
    orderId?: string
    reason?: string
  }
}

// ====== VALIDATION ======

export interface ValidationResult {
  valid: boolean
  errors?: string[]
}

// ====== CROSSMINT SDK TYPES ======

export interface CrossmintCheckoutConfig {
  lineItems: Array<{
    price: string
    currency: string
    quantity: number
    metadata?: Record<string, any>
  }>
  checkoutProps?: {
    payment?: {
      allowedMethods?: string[]
    }
    preferredChains?: string[]
    locale?: string
  }
  onEvent?: (event: CrossmintEvent) => void
}

export interface CrossmintEvent {
  type: string
  payload: {
    orderId: string
    [key: string]: any
  }
}

export interface CrossmintLineItem {
  price: string
  currency: string
  quantity: number
  metadata?: Record<string, any>
}
