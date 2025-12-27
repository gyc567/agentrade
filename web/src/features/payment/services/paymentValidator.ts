/**
 * Payment Validator Service
 * Data validation for payment operations
 */

import { PAYMENT_PACKAGES } from "../constants/packages"
import type { PaymentPackage, ValidationResult } from "../types/payment"

/**
 * Validates if a package ID is valid and safe
 * Accepts dynamic package IDs from backend, not limited to hardcoded list
 */
export function validatePackageId(id: unknown): id is string {
  if (typeof id !== "string") return false
  if (id.length === 0 || id.length > 50) return false
  // Allow alphanumeric, hyphens, underscores
  return /^[a-z0-9_-]+$/i.test(id)
}

/**
 * Validates if a price is within acceptable range
 */
export function validatePrice(price: unknown): boolean {
  if (typeof price !== "number") return false
  if (!Number.isFinite(price)) return false
  return price > 0 && price <= 10000
}

/**
 * Validates if credits amount is valid
 */
export function validateCreditsAmount(credits: unknown): boolean {
  if (typeof credits !== "number") return false
  if (!Number.isInteger(credits)) return false
  return credits > 0 && credits <= 1000000
}

/**
 * Safely retrieves a payment package by ID
 * Returns null if not found (defensive programming)
 *
 * [M3] Type Safety Fix: Ensure null is returned for missing packages
 * Not just undefined when package doesn't exist
 */
export function getPackage(id: unknown): PaymentPackage | null {
  if (!validatePackageId(id)) {
    return null
  }

  // Type-safe lookup: explicitly return null if package not found
  const pkg = PAYMENT_PACKAGES[id as keyof typeof PAYMENT_PACKAGES]
  return pkg ?? null
}

/**
 * Validates a complete payment order object
 * Returns validation result with errors list
 */
export function validateOrder(order: unknown): ValidationResult {
  const errors: string[] = []

  // Type guard
  if (!order || typeof order !== "object") {
    return {
      valid: false,
      errors: ["Order must be an object"],
    }
  }

  const o = order as Record<string, unknown>

  // Required fields validation
  if (!o.id || typeof o.id !== "string") {
    errors.push("Order ID is required and must be a string")
  }

  if (!o.userId || typeof o.userId !== "string") {
    errors.push("User ID is required and must be a string")
  }

  if (!o.packageId || !validatePackageId(o.packageId)) {
    errors.push("Invalid or missing package ID")
  }

  // Nested object validation
  const payment = o.payment as Record<string, unknown>
  if (!payment || !validatePrice((payment as any)?.amount)) {
    errors.push("Invalid payment amount")
  }

  const credits = o.credits as Record<string, unknown>
  if (!credits || !validateCreditsAmount((credits as any)?.totalCredits)) {
    errors.push("Invalid credits amount")
  }

  // Status validation
  const validStatuses = [
    "pending",
    "paid",
    "completed",
    "failed",
    "cancelled",
  ]
  if (!o.status || !validStatuses.includes(o.status as string)) {
    errors.push("Invalid order status")
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Validates a package before payment
 */
export function validatePackageForPayment(
  packageId: unknown
): { valid: true; package: PaymentPackage } | { valid: false; error: string } {
  if (!validatePackageId(packageId)) {
    return {
      valid: false,
      error: "Invalid package ID",
    }
  }

  const pkg = PAYMENT_PACKAGES[packageId as keyof typeof PAYMENT_PACKAGES]

  if (!pkg) {
    return {
      valid: false,
      error: "Package not found",
    }
  }

  if (!validatePrice(pkg.price.amount)) {
    return {
      valid: false,
      error: "Invalid package price",
    }
  }

  if (!validateCreditsAmount(pkg.credits.amount)) {
    return {
      valid: false,
      error: "Invalid credit amount",
    }
  }

  return {
    valid: true,
    package: pkg,
  }
}
