/**
 * Payment Error Boundary Component
 * Catches and handles errors in payment components
 *
 * KISS: Simple error boundary with retry functionality
 * High Cohesion: All payment error handling in one component
 */

import React, { Component, type ReactNode } from 'react'
import styles from '../styles/payment-modal.module.css'

interface PaymentErrorBoundaryProps {
  children: ReactNode
  /** Optional custom fallback component */
  fallback?: ReactNode
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  /** Callback when user clicks retry */
  onRetry?: () => void
}

interface PaymentErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary for Payment Components
 *
 * Catches JavaScript errors in child components and displays
 * a user-friendly error message with retry option.
 *
 * Usage:
 * ```tsx
 * <PaymentErrorBoundary onRetry={() => reset()}>
 *   <PaymentModal />
 * </PaymentErrorBoundary>
 * ```
 */
export class PaymentErrorBoundary extends Component<
  PaymentErrorBoundaryProps,
  PaymentErrorBoundaryState
> {
  constructor(props: PaymentErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): PaymentErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error for debugging (in dev only via logger)
    if (import.meta.env.DEV) {
      console.error('[PaymentErrorBoundary] Caught error:', error)
      console.error('[PaymentErrorBoundary] Error info:', errorInfo)
    }

    // Call optional error callback
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
    this.props.onRetry?.()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className={styles.errorContainer} role="alert" aria-live="assertive">
          <div className={styles.errorIcon} aria-hidden="true">
            ⚠️
          </div>
          <h3 className={styles.errorTitle}>支付组件出错</h3>
          <p className={styles.errorMessage}>
            {this.state.error?.message || '发生未知错误，请重试'}
          </p>
          <div className={styles.errorButtonGroup}>
            <button
              onClick={this.handleRetry}
              className={styles.retryButton}
              aria-label="重试"
            >
              重试
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * PaymentErrorFallback Component
 * Standalone fallback component for custom error displays
 */
interface PaymentErrorFallbackProps {
  error?: Error | null
  onRetry?: () => void
  title?: string
  message?: string
}

export function PaymentErrorFallback({
  error,
  onRetry,
  title = '支付出错',
  message,
}: PaymentErrorFallbackProps): JSX.Element {
  return (
    <div className={styles.errorContainer} role="alert" aria-live="assertive">
      <div className={styles.errorIcon} aria-hidden="true">
        ⚠️
      </div>
      <h3 className={styles.errorTitle}>{title}</h3>
      <p className={styles.errorMessage}>
        {message || error?.message || '发生未知错误，请重试'}
      </p>
      {onRetry && (
        <div className={styles.errorButtonGroup}>
          <button
            onClick={onRetry}
            className={styles.retryButton}
            aria-label="重试"
          >
            重试
          </button>
        </div>
      )}
    </div>
  )
}
