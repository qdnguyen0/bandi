import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AgentDetail from './AgentDetail'
import type { Agent } from '../types'

// Stub framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock API module
const mockFetchAgent = vi.fn()
const mockFetchReviews = vi.fn()
const mockFetchPurchaseStatus = vi.fn()
const mockCreateCheckout = vi.fn()
const mockFetchAgentSummary = vi.fn()

vi.mock('../api', () => ({
  fetchAgent: (...args: unknown[]) => mockFetchAgent(...args),
  fetchReviews: (...args: unknown[]) => mockFetchReviews(...args),
  fetchPurchaseStatus: (...args: unknown[]) => mockFetchPurchaseStatus(...args),
  createCheckout: (...args: unknown[]) => mockCreateCheckout(...args),
  fetchAgentSummary: (...args: unknown[]) => mockFetchAgentSummary(...args),
}))

// Mock AuthContext
const mockUseAuth = vi.fn()
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock AuthModal and CheckoutModal to keep tests focused
vi.mock('../components/AuthModal', () => ({
  default: ({ open, onSuccess }: { open: boolean; onSuccess?: () => void }) =>
    open ? (
      <div data-testid="auth-modal">
        <button onClick={onSuccess}>Mock Login Success</button>
      </div>
    ) : null,
}))

vi.mock('../components/CheckoutModal', () => ({
  default: ({ open }: { open: boolean }) =>
    open ? <div data-testid="checkout-modal" /> : null,
}))

// Mock Marketplace MOCK_AGENTS to avoid the Marketplace module loading all its deps
vi.mock('./Marketplace', () => ({
  MOCK_AGENTS: [] as Agent[],
}))

const mockAgent: Agent = {
  id: 1,
  name: 'NeuralScribe Pro',
  description: 'Advanced language model agent',
  category: 'NLP',
  price: 49,
  rental_rate: 9,
  has_trial: true,
  download_count: 12847,
  creator_id: 1,
  created_at: '2025-08-15',
  avatar: 'https://example.com/avatar.svg',
  developer: 'SynthLabs AI',
  rating: 4.8,
  review_count: 0,
  source_size: '2.4 MB',
  language: 'Python',
  license: 'MIT',
  last_updated: '2026-03-01',
  comments: [],
}

const loggedInUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'user',
  created_at: '2025-01-01',
}

function renderAgentDetail(agentId = '1') {
  return render(
    <MemoryRouter initialEntries={[`/agents/${agentId}`]}>
      <Routes>
        <Route path="/agents/:id" element={<AgentDetail />} />
        <Route path="/" element={<div>Marketplace</div>} />
      </Routes>
    </MemoryRouter>
  )
}

const mockReviews = {
  reviews: [
    { id: 1, user: 'neo_coder', avatar: 'https://example.com/av.svg', text: 'Great agent!', rating: 5, date: '2026-03-01' },
    { id: 2, user: 'data_witch', avatar: 'https://example.com/av2.svg', text: 'Solid tool', rating: 4, date: '2026-02-15' },
  ],
  total: 25,
  page: 1,
  limit: 10,
}

describe('AgentDetail purchase flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchReviews.mockResolvedValue({ reviews: [], total: 0, page: 1, limit: 10 })
  })

  it('shows buy/rent buttons when user has no purchase', async () => {
    mockUseAuth.mockReturnValue({ user: loggedInUser, loading: false, login: vi.fn(), logout: vi.fn() })
    mockFetchAgent.mockResolvedValue(mockAgent)
    mockFetchPurchaseStatus.mockResolvedValue({ purchase: null })

    renderAgentDetail()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /buy \$49/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /rent \$9\/mo/i })).toBeInTheDocument()
    })
  })

  it('shows Purchased badge when user owns the agent (buy)', async () => {
    mockUseAuth.mockReturnValue({ user: loggedInUser, loading: false, login: vi.fn(), logout: vi.fn() })
    mockFetchAgent.mockResolvedValue(mockAgent)
    mockFetchPurchaseStatus.mockResolvedValue({
      purchase: { id: 1, type: 'buy', expiry_date: null },
    })

    renderAgentDetail()

    await waitFor(() => {
      expect(screen.getByText('Purchased')).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: /buy \$49/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /rent \$9\/mo/i })).not.toBeInTheDocument()
  })

  it('shows Rented badge when user rents the agent', async () => {
    mockUseAuth.mockReturnValue({ user: loggedInUser, loading: false, login: vi.fn(), logout: vi.fn() })
    mockFetchAgent.mockResolvedValue(mockAgent)
    mockFetchPurchaseStatus.mockResolvedValue({
      purchase: { id: 2, type: 'rent', expiry_date: '2026-04-19T00:00:00Z' },
    })

    renderAgentDetail()

    await waitFor(() => {
      expect(screen.getByText('Rented')).toBeInTheDocument()
    })
  })

  it('shows Trial Active badge for active trial', async () => {
    mockUseAuth.mockReturnValue({ user: loggedInUser, loading: false, login: vi.fn(), logout: vi.fn() })
    mockFetchAgent.mockResolvedValue(mockAgent)
    mockFetchPurchaseStatus.mockResolvedValue({
      purchase: { id: 3, type: 'trial', expiry_date: '2026-04-01T00:00:00Z' },
    })

    renderAgentDetail()

    await waitFor(() => {
      expect(screen.getByText('Trial Active')).toBeInTheDocument()
    })
  })

  it('shows auth modal when not logged in and clicking Buy', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, login: vi.fn(), logout: vi.fn() })
    mockFetchAgent.mockResolvedValue(mockAgent)
    // fetchPurchaseStatus won't be called when user is null (component skips it)

    renderAgentDetail()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /buy \$49/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /buy \$49/i }))

    await waitFor(() => {
      expect(screen.getByTestId('auth-modal')).toBeInTheDocument()
    })
  })

  it('calls createCheckout after auth success', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, login: vi.fn(), logout: vi.fn() })
    mockFetchAgent.mockResolvedValue(mockAgent)
    mockCreateCheckout.mockResolvedValue({ purchase: {} })
    mockFetchPurchaseStatus.mockResolvedValue({ purchase: null })

    renderAgentDetail()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /buy \$49/i })).toBeInTheDocument()
    })

    // Click Buy — triggers auth gate since user is null
    await userEvent.click(screen.getByRole('button', { name: /buy \$49/i }))

    await waitFor(() => {
      expect(screen.getByTestId('auth-modal')).toBeInTheDocument()
    })

    // Simulate successful login via the mocked modal's button
    await userEvent.click(screen.getByRole('button', { name: 'Mock Login Success' }))

    await waitFor(() => {
      expect(mockCreateCheckout).toHaveBeenCalledWith(1, 'buy')
    })
  })
})

describe('AgentDetail — loading state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchReviews.mockResolvedValue({ reviews: [], total: 0, page: 1, limit: 10 })
  })

  it('shows LOADING AGENT... while fetchAgent is pending', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, login: vi.fn(), logout: vi.fn() })
    // Return a promise that never resolves so the component stays in loading state
    mockFetchAgent.mockReturnValue(new Promise(() => {}))

    renderAgentDetail()

    expect(screen.getByText('LOADING AGENT...')).toBeInTheDocument()
  })
})

describe('AgentDetail — back button', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchReviews.mockResolvedValue({ reviews: [], total: 0, page: 1, limit: 10 })
  })

  it('navigates to / when clicking Back to Marketplace', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, login: vi.fn(), logout: vi.fn() })
    mockFetchAgent.mockResolvedValue(mockAgent)

    renderAgentDetail()

    await waitFor(() => {
      expect(screen.getByText('Back to Marketplace')).toBeInTheDocument()
    })

    await userEvent.click(screen.getByText('Back to Marketplace'))

    await waitFor(() => {
      expect(screen.getByText('Marketplace')).toBeInTheDocument()
    })
  })
})

describe('AgentDetail — stats grid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchReviews.mockResolvedValue({ reviews: [], total: 0, page: 1, limit: 10 })
  })

  it('renders stats grid with download count and prices', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, login: vi.fn(), logout: vi.fn() })
    mockFetchAgent.mockResolvedValue(mockAgent)

    renderAgentDetail()

    await waitFor(() => {
      expect(screen.getByText('Downloads')).toBeInTheDocument()
    })

    expect(screen.getByText('$49')).toBeInTheDocument()
    expect(screen.getByText('$9')).toBeInTheDocument()
  })
})

describe('AgentDetail — trial button', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchReviews.mockResolvedValue({ reviews: [], total: 0, page: 1, limit: 10 })
  })

  it('shows Free Trial button when agent has_trial is true', async () => {
    mockUseAuth.mockReturnValue({ user: loggedInUser, loading: false, login: vi.fn(), logout: vi.fn() })
    mockFetchAgent.mockResolvedValue({ ...mockAgent, has_trial: true })
    mockFetchPurchaseStatus.mockResolvedValue({ purchase: null })

    renderAgentDetail()

    await waitFor(() => {
      // The button with role button named Free Trial in the actions section
      const trialButtons = screen.getAllByText('Free Trial')
      expect(trialButtons.length).toBeGreaterThan(0)
    })
  })
})

describe('AgentDetail — trial purchase flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchReviews.mockResolvedValue({ reviews: [], total: 0, page: 1, limit: 10 })
  })

  it('shows Trial activated successfully! after clicking Free Trial as logged-in user', async () => {
    mockUseAuth.mockReturnValue({ user: loggedInUser, loading: false, login: vi.fn(), logout: vi.fn() })
    mockFetchAgent.mockResolvedValue({ ...mockAgent, has_trial: true })
    mockFetchPurchaseStatus.mockResolvedValue({ purchase: null })
    mockCreateCheckout.mockResolvedValue({ purchase: {} })

    renderAgentDetail()

    // Wait for the buy button so we know the agent loaded
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /buy \$49/i })).toBeInTheDocument()
    })

    // Click the Free Trial button (it's a motion.button rendered as a plain button via mock)
    const trialBtn = screen.getByRole('button', { name: /free trial/i })
    await userEvent.click(trialBtn)

    await waitFor(() => {
      expect(screen.getByText('Trial activated successfully!')).toBeInTheDocument()
    })
  })
})

describe('AgentDetail — rent checkout modal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchReviews.mockResolvedValue({ reviews: [], total: 0, page: 1, limit: 10 })
  })

  it('shows checkout modal when logged-in user clicks Rent and checkout returns purchase', async () => {
    mockUseAuth.mockReturnValue({ user: loggedInUser, loading: false, login: vi.fn(), logout: vi.fn() })
    mockFetchAgent.mockResolvedValue(mockAgent)
    mockFetchPurchaseStatus.mockResolvedValue({ purchase: null })
    mockCreateCheckout.mockResolvedValue({ purchase: {} })

    renderAgentDetail()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /rent \$9\/mo/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /rent \$9\/mo/i }))

    await waitFor(() => {
      expect(screen.getByTestId('checkout-modal')).toBeInTheDocument()
    })
  })
})

describe('AgentDetail — reviews section', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders review text and usernames when reviews are returned', async () => {
    const agentWithReviews = { ...mockAgent, review_count: 25 }
    mockUseAuth.mockReturnValue({ user: loggedInUser, loading: false, login: vi.fn(), logout: vi.fn() })
    mockFetchAgent.mockResolvedValue(agentWithReviews)
    mockFetchPurchaseStatus.mockResolvedValue({ purchase: null })
    mockFetchReviews.mockResolvedValue(mockReviews)

    renderAgentDetail()

    await waitFor(() => {
      expect(screen.getByText('neo_coder')).toBeInTheDocument()
    })

    expect(screen.getByText('Great agent!')).toBeInTheDocument()
    expect(screen.getByText('data_witch')).toBeInTheDocument()
    expect(screen.getByText('Solid tool')).toBeInTheDocument()
  })
})

describe('AgentDetail — review pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows pagination controls when total > limit', async () => {
    const agentWithReviews = { ...mockAgent, review_count: 25 }
    mockUseAuth.mockReturnValue({ user: loggedInUser, loading: false, login: vi.fn(), logout: vi.fn() })
    mockFetchAgent.mockResolvedValue(agentWithReviews)
    mockFetchPurchaseStatus.mockResolvedValue({ purchase: null })
    mockFetchReviews.mockResolvedValue(mockReviews) // total: 25, limit: 10

    renderAgentDetail()

    await waitFor(() => {
      expect(screen.getByText('neo_coder')).toBeInTheDocument()
    })

    // Pagination: page 1 is active, page 2 and 3 should be visible (25 reviews, 10 per page = 3 pages)
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument()
  })

  it('changes page when a page number button is clicked', async () => {
    const agentWithReviews = { ...mockAgent, review_count: 25 }
    mockUseAuth.mockReturnValue({ user: loggedInUser, loading: false, login: vi.fn(), logout: vi.fn() })
    mockFetchAgent.mockResolvedValue(agentWithReviews)
    mockFetchPurchaseStatus.mockResolvedValue({ purchase: null })
    mockFetchReviews.mockResolvedValue(mockReviews)

    renderAgentDetail()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: '2' }))

    await waitFor(() => {
      expect(mockFetchReviews).toHaveBeenCalledWith(1, 2, 10)
    })
  })
})

describe('AgentDetail — AI Summary button', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchReviews.mockResolvedValue({ reviews: [], total: 0, page: 1, limit: 10 })
  })

  it('renders AI Summary button in the document', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, login: vi.fn(), logout: vi.fn() })
    mockFetchAgent.mockResolvedValue(mockAgent)

    renderAgentDetail()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ai summary/i })).toBeInTheDocument()
    })
  })

  it('clicking AI Summary calls fetchAgentSummary and shows the result', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, login: vi.fn(), logout: vi.fn() })
    mockFetchAgent.mockResolvedValue(mockAgent)
    mockFetchAgentSummary.mockResolvedValue('This is a great AI agent with excellent NLP capabilities.')

    renderAgentDetail()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /ai summary/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /ai summary/i }))

    await waitFor(() => {
      expect(screen.getByText('This is a great AI agent with excellent NLP capabilities.')).toBeInTheDocument()
    })
  })
})

describe('AgentDetail — Stripe checkout redirect', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchReviews.mockResolvedValue({ reviews: [], total: 0, page: 1, limit: 10 })
  })

  it('redirects to Stripe URL when createCheckout returns a url', async () => {
    const originalLocation = window.location
    // Replace window.location with a writable object
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    })

    mockUseAuth.mockReturnValue({ user: loggedInUser, loading: false, login: vi.fn(), logout: vi.fn() })
    mockFetchAgent.mockResolvedValue(mockAgent)
    mockFetchPurchaseStatus.mockResolvedValue({ purchase: null })
    mockCreateCheckout.mockResolvedValue({ url: 'https://checkout.stripe.com/pay/test123' })

    renderAgentDetail()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /buy \$49/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /buy \$49/i }))

    await waitFor(() => {
      expect(window.location.href).toBe('https://checkout.stripe.com/pay/test123')
    })

    // Restore
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    })
  })
})
