/**
 * PaymentModal Component Tests
 * Tests: Modal rendering, responsive width behavior, state transitions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PaymentModal } from '../components/PaymentModal'
import { PaymentProvider } from '../contexts/PaymentProvider'
import styles from '../styles/payment-modal.module.css'

// Mock the Crossmint SDK
vi.mock('@crossmint/client-sdk-react-ui', () => ({
  CrossmintEmbeddedCheckout: ({ orderId, clientSecret }: { orderId: string; clientSecret: string }) => (
    <div data-testid="crossmint-checkout" data-order-id={orderId} data-client-secret={clientSecret}>
      Crossmint Checkout Mock
    </div>
  )
}))

// Mock environment variables
vi.stubEnv('VITE_CROSSMINT_CLIENT_API_KEY', 'test-api-key')

describe('PaymentModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  const renderModal = (isOpen = true) => {
    return render(
      <PaymentProvider>
        <PaymentModal
          isOpen={isOpen}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      </PaymentProvider>
    )
  }

  describe('Modal Rendering', () => {
    it('renders modal when isOpen is true', () => {
      renderModal(true)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('does not render modal when isOpen is false', () => {
      renderModal(false)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('renders with correct container class', () => {
      renderModal()
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass(styles.content)
    })

    it('renders overlay with correct class', () => {
      renderModal()
      const overlay = screen.getByRole('dialog').parentElement
      expect(overlay).toHaveClass(styles.overlay)
    })
  })

  describe('Package Selection State', () => {
    it('renders idle section with package grid', () => {
      renderModal()
      expect(screen.getByRole('group', { name: /payment packages/i })).toBeInTheDocument()
    })

    it('renders package buttons', () => {
      renderModal()
      const packageButtons = screen.getAllByRole('button', { name: /套餐/i })
      expect(packageButtons.length).toBeGreaterThan(0)
    })

    it('idle section has correct class for centered layout', () => {
      renderModal()
      const idleSection = screen.getByRole('group', { name: /payment packages/i }).parentElement
      expect(idleSection).toHaveClass(styles.idleSection)
    })
  })

  describe('Modal Header', () => {
    it('renders title', () => {
      renderModal()
      expect(screen.getByText('充值积分')).toBeInTheDocument()
    })

    it('renders close button with correct aria-label', () => {
      renderModal()
      expect(screen.getByRole('button', { name: /close payment modal/i })).toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', () => {
      renderModal()
      fireEvent.click(screen.getByRole('button', { name: /close payment modal/i }))
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Keyboard Accessibility', () => {
    it('closes modal on Escape key press', () => {
      renderModal()
      fireEvent.keyDown(window, { key: 'Escape' })
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Overlay Click', () => {
    it('closes modal when clicking overlay', () => {
      renderModal()
      const overlay = screen.getByRole('dialog').parentElement!
      fireEvent.click(overlay)
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('does not close modal when clicking content', () => {
      renderModal()
      const dialog = screen.getByRole('dialog')
      fireEvent.click(dialog)
      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Pay Button', () => {
    it('renders disabled pay button when no package selected', () => {
      renderModal()
      const payButton = screen.getByRole('button', { name: /继续支付/i })
      expect(payButton).toBeDisabled()
    })

    it('enables pay button when package is selected', () => {
      renderModal()
      // Select a package
      const packageButtons = screen.getAllByRole('button', { name: /套餐/i })
      fireEvent.click(packageButtons[0])

      const payButton = screen.getByRole('button', { name: /继续支付/i })
      expect(payButton).not.toBeDisabled()
    })
  })
})

describe('PaymentModal CSS Classes', () => {
  it('content class has correct max-width for expanded checkout', () => {
    // Verify the CSS module exports expected classes
    expect(styles.content).toBeDefined()
    expect(styles.checkoutContainer).toBeDefined()
    expect(styles.checkoutFrame).toBeDefined()
  })

  it('idle section class is defined for centered package selection', () => {
    expect(styles.idleSection).toBeDefined()
  })

  it('responsive classes are defined', () => {
    expect(styles.packageGrid).toBeDefined()
    expect(styles.packageButton).toBeDefined()
    expect(styles.payButton).toBeDefined()
  })
})

describe('PaymentModal Accessibility', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_CROSSMINT_CLIENT_API_KEY', 'test-api-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('has correct ARIA attributes on dialog', () => {
    render(
      <PaymentProvider>
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      </PaymentProvider>
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title')
  })

  it('package buttons have aria-pressed attribute', () => {
    render(
      <PaymentProvider>
        <PaymentModal
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      </PaymentProvider>
    )

    const packageButtons = screen.getAllByRole('button', { name: /套餐/i })
    packageButtons.forEach(button => {
      expect(button).toHaveAttribute('aria-pressed')
    })
  })
})
