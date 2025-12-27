/**
 * Payment Context
 * Global state management for payment feature
 * Separate from Auth context for clean separation of concerns
 */

import { createContext } from "react"
import type { PaymentContextType } from "../types/payment"

export const PaymentContext = createContext<PaymentContextType | null>(null)

PaymentContext.displayName = "PaymentContext"
