/**
 * Payment Feature - Public API
 * Exports all public interfaces and components
 */

// Context & Provider
export { PaymentContext } from "./contexts/PaymentContext"
export { PaymentProvider, usePaymentContext } from "./contexts/PaymentProvider"

// Hooks
export { usePaymentPackages } from "./hooks/usePaymentPackages"
export { useCrossmintCheckout } from "./hooks/useCrossmintCheckout"
export { usePaymentHistory } from "./hooks/usePaymentHistory"
export { usePricingData } from "./hooks/usePricingData"

// Components
export { PaymentModal } from "./components/PaymentModal"
export { PricingCard } from "./components/PricingCard"
export { PaymentErrorBoundary, PaymentErrorFallback } from "./components/PaymentErrorBoundary"

// Types
export type {
  PaymentOrder,
  PaymentPackage,
  PaymentContextType,
  PaymentEvent,
  PaymentConfirmRequest,
  PaymentConfirmResponse,
} from "./types/payment"

// Constants
export { PAYMENT_PACKAGES, PACKAGE_IDS } from "./constants/packages"
export { ALL_ERROR_CODES, ERROR_MESSAGES } from "./constants/errorCodes"
export {
  PRICING_FEATURES_EN,
  PRICING_FEATURES_ZH,
  BLOCKCHAINS,
  PRICING_FAQ_EN,
  PRICING_FAQ_ZH,
  PRICING_COMPARISON_EN,
  PRICING_COMPARISON_ZH,
  getPricingContent,
} from "./constants/pricing-content"

// Validators & Utils
export {
  validatePackageId,
  validatePrice,
  validateCreditsAmount,
  getPackage,
  validateOrder,
  validatePackageForPayment,
} from "./services/paymentValidator"

export { formatPrice, formatCredits, formatPercentage } from "./utils/formatPrice"

// Security Utils
export {
  verifyHmacSignature,
  createHmacSignature,
  timingSafeEqual,
} from "./utils/signatureVerification"
