/**
 * PaymentErrorBoundary Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PaymentErrorBoundary, PaymentErrorFallback } from '../components/PaymentErrorBoundary'

// Component that throws an error
function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

// Suppress console.error for expected errors in tests
const originalError = console.error
beforeEach(() => {
  console.error = vi.fn()
})

afterEach(() => {
  console.error = originalError
})

describe('PaymentErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <PaymentErrorBoundary>
        <div>Child content</div>
      </PaymentErrorBoundary>
    )

    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('renders error UI when child throws', () => {
    render(
      <PaymentErrorBoundary>
        <ThrowingComponent />
      </PaymentErrorBoundary>
    )

    expect(screen.getByText('支付组件出错')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    render(
      <PaymentErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent />
      </PaymentErrorBoundary>
    )

    expect(screen.getByText('Custom fallback')).toBeInTheDocument()
  })

  it('calls onError callback when error occurs', () => {
    const onError = vi.fn()

    render(
      <PaymentErrorBoundary onError={onError}>
        <ThrowingComponent />
      </PaymentErrorBoundary>
    )

    expect(onError).toHaveBeenCalled()
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
  })

  it('calls onRetry callback when retry button clicked', () => {
    const onRetry = vi.fn()

    render(
      <PaymentErrorBoundary onRetry={onRetry}>
        <ThrowingComponent />
      </PaymentErrorBoundary>
    )

    fireEvent.click(screen.getByRole('button', { name: /重试/i }))

    expect(onRetry).toHaveBeenCalled()
  })

  it('resets error state when retry is clicked', () => {
    let shouldThrow = true

    function ConditionalThrow() {
      if (shouldThrow) {
        throw new Error('Test error')
      }
      return <div>No error</div>
    }

    const { rerender } = render(
      <PaymentErrorBoundary>
        <ConditionalThrow />
      </PaymentErrorBoundary>
    )

    // Error is shown
    expect(screen.getByText('支付组件出错')).toBeInTheDocument()

    // Set flag before clicking retry
    shouldThrow = false

    // Click retry - this resets the error boundary state
    fireEvent.click(screen.getByRole('button', { name: /重试/i }))

    // Force rerender to pick up state change
    rerender(
      <PaymentErrorBoundary>
        <ConditionalThrow />
      </PaymentErrorBoundary>
    )

    expect(screen.getByText('No error')).toBeInTheDocument()
  })

  it('has accessible error alert', () => {
    render(
      <PaymentErrorBoundary>
        <ThrowingComponent />
      </PaymentErrorBoundary>
    )

    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveAttribute('aria-live', 'assertive')
  })
})

describe('PaymentErrorFallback', () => {
  it('renders with default props', () => {
    render(<PaymentErrorFallback />)

    expect(screen.getByText('支付出错')).toBeInTheDocument()
    expect(screen.getByText('发生未知错误，请重试')).toBeInTheDocument()
  })

  it('renders with custom title and message', () => {
    render(
      <PaymentErrorFallback
        title="Custom Title"
        message="Custom message"
      />
    )

    expect(screen.getByText('Custom Title')).toBeInTheDocument()
    expect(screen.getByText('Custom message')).toBeInTheDocument()
  })

  it('displays error message from Error object', () => {
    const error = new Error('Specific error message')

    render(<PaymentErrorFallback error={error} />)

    expect(screen.getByText('Specific error message')).toBeInTheDocument()
  })

  it('renders retry button when onRetry provided', () => {
    const onRetry = vi.fn()

    render(<PaymentErrorFallback onRetry={onRetry} />)

    const retryButton = screen.getByRole('button', { name: /重试/i })
    expect(retryButton).toBeInTheDocument()

    fireEvent.click(retryButton)
    expect(onRetry).toHaveBeenCalled()
  })

  it('does not render retry button when onRetry not provided', () => {
    render(<PaymentErrorFallback />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
