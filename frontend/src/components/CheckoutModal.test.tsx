import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CheckoutModal from './CheckoutModal'

// Stub framer-motion so AnimatePresence renders children immediately
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockAgent = {
  name: 'NeuralScribe Pro',
  avatar: 'https://example.com/avatar.svg',
  price: 49,
  rental_rate: 9,
}

describe('CheckoutModal', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
    agent: mockAgent,
    purchaseType: 'buy' as const,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders agent name, price, and purchase type for buy', () => {
    render(<CheckoutModal {...defaultProps} purchaseType="buy" />)
    expect(screen.getByText('NeuralScribe Pro')).toBeInTheDocument()
    expect(screen.getByText('$49')).toBeInTheDocument()
    expect(screen.getByText('One-time Purchase')).toBeInTheDocument()
  })

  it('renders agent name, rental price, and purchase type for rent', () => {
    render(<CheckoutModal {...defaultProps} purchaseType="rent" />)
    expect(screen.getByText('NeuralScribe Pro')).toBeInTheDocument()
    expect(screen.getByText('$9')).toBeInTheDocument()
    expect(screen.getByText('Monthly Rental')).toBeInTheDocument()
  })

  it('shows Pay button with correct price', () => {
    render(<CheckoutModal {...defaultProps} purchaseType="buy" />)
    expect(screen.getByRole('button', { name: /Pay \$49/i })).toBeInTheDocument()
  })

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn()
    render(<CheckoutModal {...defaultProps} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not render anything when open is false', () => {
    render(<CheckoutModal {...defaultProps} open={false} />)
    expect(screen.queryByText('NeuralScribe Pro')).not.toBeInTheDocument()
  })

  it('shows success animation and calls onSuccess after payment simulation', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const onSuccess = vi.fn()
    render(<CheckoutModal {...defaultProps} onSuccess={onSuccess} />)

    const payButton = screen.getByRole('button', { name: /Pay \$49/i })
    await userEvent.click(payButton)

    // After 1500ms processing delay, success state shows
    await act(() => vi.advanceTimersByTimeAsync(1500))
    await waitFor(() => {
      expect(screen.getByText('Payment Successful')).toBeInTheDocument()
    })

    // After another 1200ms onSuccess is called
    await act(() => vi.advanceTimersByTimeAsync(1200))
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledOnce()
    })

    vi.useRealTimers()
  })
})
