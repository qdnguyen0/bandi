import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthModal from './AuthModal'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockLogin = vi.fn()
const mockRegister = vi.fn()

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: mockLogin,
    register: mockRegister,
    logout: vi.fn(),
  }),
}))

describe('AuthModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form by default', () => {
    render(
      <AuthModal open={true} onClose={vi.fn()} />
    )
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    // Signup-specific fields should not be visible in login mode
    expect(screen.queryByPlaceholderText('Email')).not.toBeInTheDocument()
  })

  it('renders dark overlay backdrop when centered=true', () => {
    const { container } = render(
      <AuthModal open={true} onClose={vi.fn()} centered={true} />
    )
    // The overlay should have a fixed inset-0 backdrop element
    const backdrop = container.querySelector('.fixed.inset-0')
    expect(backdrop).toBeInTheDocument()
  })

  it('does NOT render overlay when centered=false', () => {
    const { container } = render(
      <AuthModal open={true} onClose={vi.fn()} centered={false} />
    )
    const backdrop = container.querySelector('.fixed.inset-0')
    expect(backdrop).not.toBeInTheDocument()
  })

  it('does not render anything when open=false', () => {
    render(<AuthModal open={false} onClose={vi.fn()} />)
    expect(screen.queryByPlaceholderText('Username')).not.toBeInTheDocument()
  })

  it('can switch between login and signup tabs', async () => {
    render(<AuthModal open={true} onClose={vi.fn()} />)

    // Initially on login tab, no email field
    expect(screen.queryByPlaceholderText('Email')).not.toBeInTheDocument()

    // Click Sign Up tab
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }))

    // Now signup-specific fields appear
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('First Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Last Name')).toBeInTheDocument()
  })

  it('calls onSuccess callback after successful login', async () => {
    mockLogin.mockResolvedValueOnce(undefined)
    const onSuccess = vi.fn()
    const onClose = vi.fn()

    render(
      <AuthModal open={true} onClose={onClose} onSuccess={onSuccess} />
    )

    await userEvent.type(screen.getByPlaceholderText('Username'), 'testuser')
    await userEvent.type(screen.getByPlaceholderText('Password'), 'password123')
    // There are two "Login" buttons (tab + submit). Target the submit one.
    const buttons = screen.getAllByRole('button', { name: /^login$/i })
    await userEvent.click(buttons.find(b => b.getAttribute('type') === 'submit')!)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123')
      expect(onSuccess).toHaveBeenCalledOnce()
      expect(onClose).toHaveBeenCalledOnce()
    })
  })

  it('shows error message when login fails', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'))

    render(<AuthModal open={true} onClose={vi.fn()} />)

    await userEvent.type(screen.getByPlaceholderText('Username'), 'testuser')
    await userEvent.type(screen.getByPlaceholderText('Password'), 'wrongpassword')
    const buttons = screen.getAllByRole('button', { name: /^login$/i })
    await userEvent.click(buttons.find(b => b.getAttribute('type') === 'submit')!)

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })
})
