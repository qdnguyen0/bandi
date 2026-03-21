import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import PeekingAgents from './PeekingAgents'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      onAnimationComplete,
      initial: _initial,
      animate: _animate,
      transition: _transition,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & {
      onAnimationComplete?: () => void
      initial?: unknown
      animate?: unknown
      transition?: unknown
    }) => (
      // Call onAnimationComplete synchronously so the phase transitions fire
      // during the render, making the head immediately "visible" in tests.
      <div
        {...props}
        ref={(el) => {
          if (el && onAnimationComplete) onAnimationComplete()
        }}
      >
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PEEK_AGENTS = [
  { id: 1, name: 'NeuralScribe', capabilities: ['summarization', 'chain-of-thought', 'doc generation'] },
  { id: 2, name: 'VisionCore', capabilities: ['object detection', 'OCR', 'image QA'] },
  { id: 3, name: 'AutoFlow', capabilities: ['API orchestration', 'DAG builder', 'retry logic'] },
  { id: 4, name: 'DataPulse', capabilities: ['anomaly detection', 'forecasting', 'BI dashboards'] },
  { id: 5, name: 'CipherGuard', capabilities: ['SAST scanning', 'secrets detection', 'SOC2 reports'] },
  { id: 6, name: 'LangBridge', capabilities: ['neural translation', 'tone control', 'streaming'] },
  { id: 7, name: 'PixelForge', capabilities: ['inpainting', 'style transfer', 'upscaling'] },
  { id: 8, name: 'PipelinePilot', capabilities: ['CI/CD generation', 'GitLab CI', 'auto-rollback'] },
]

const ALL_AGENT_NAMES = PEEK_AGENTS.map((a) => a.name)

// After onAnimationComplete fires (sync via ref mock), the bubble appears after
// a 400ms setTimeout. This helper advances time past that threshold.
const BUBBLE_DELAY = 400

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PeekingAgents', () => {
  it('renders without crashing', () => {
    expect(() => render(<PeekingAgents />)).not.toThrow()
  })

  it('shows at least one agent name after timers fire', async () => {
    render(<PeekingAgents />)

    // Advance past the 400ms bubble timer so the speech bubble appears.
    await act(async () => {
      vi.advanceTimersByTime(BUBBLE_DELAY)
    })

    // The component renders names as "Hi, I'm {name}!"
    const visibleNames = ALL_AGENT_NAMES.filter(
      (name) => screen.queryByText(`Hi, I'm ${name}!`) !== null,
    )
    expect(visibleNames.length).toBeGreaterThanOrEqual(1)
  })

  it('shows capability chips for the visible agent', async () => {
    render(<PeekingAgents />)

    // Advance past the 400ms bubble delay.
    await act(async () => {
      vi.advanceTimersByTime(BUBBLE_DELAY)
    })

    // Find which agent's bubble is shown and assert all three capability chips appear.
    const shownAgent = PEEK_AGENTS.find(
      (agent) => screen.queryByText(`Hi, I'm ${agent.name}!`) !== null,
    )
    expect(shownAgent).toBeDefined()
    for (const cap of shownAgent!.capabilities) {
      expect(screen.queryByText(cap)).toBeInTheDocument()
    }
  })

  it('clicking the head area navigates to /agents/:id', async () => {
    render(<PeekingAgents />)

    // Advance past the 400ms bubble delay so we can identify which agent is shown.
    await act(async () => {
      vi.advanceTimersByTime(BUBBLE_DELAY)
    })

    // Find the visible agent.
    const shownAgent = PEEK_AGENTS.find(
      (agent) => screen.queryByText(`Hi, I'm ${agent.name}!`) !== null,
    )
    expect(shownAgent).toBeDefined()

    // Click the agent name element — the click bubbles up to the outer div
    // (motion.div mock) which carries the onClick handler.
    const nameEl = screen.getByText(`Hi, I'm ${shownAgent!.name}!`)
    fireEvent.click(nameEl)

    expect(mockNavigate).toHaveBeenCalledWith(`/agents/${shownAgent!.id}`)
  })

  it('left peeking head has rotate(30deg) transform', async () => {
    render(<PeekingAgents />)

    await act(async () => {
      vi.advanceTimersByTime(BUBBLE_DELAY)
    })

    // The avatar div (the round robot head) carries the avatarRotation style.
    // Left side uses rotate(30deg), right side uses rotate(-30deg).
    // Find all avatar img elements and check their parent div's transform.
    const avatarImgs = document.querySelectorAll('img[alt]')
    const leftAvatar = Array.from(avatarImgs).find((img) => {
      const parent = img.parentElement
      return parent?.style?.transform === 'rotate(30deg)'
    })
    expect(leftAvatar).toBeDefined()
  })

  it('right peeking head has rotate(-30deg) transform', async () => {
    render(<PeekingAgents />)

    // Advance past the 1500ms stagger so the right agent is also mounted,
    // then past the 400ms bubble delay.
    await act(async () => {
      vi.advanceTimersByTime(1500 + BUBBLE_DELAY)
    })

    const avatarImgs = document.querySelectorAll('img[alt]')
    const rightAvatar = Array.from(avatarImgs).find((img) => {
      const parent = img.parentElement
      return parent?.style?.transform === 'rotate(-30deg)'
    })
    expect(rightAvatar).toBeDefined()
  })

  it('both left and right agents appear after the 1500ms stagger', async () => {
    render(<PeekingAgents />)

    // Step 1: advance past the left bubble delay (400ms).
    await act(async () => {
      vi.advanceTimersByTime(BUBBLE_DELAY)
    })

    // Step 2: advance past the 1500ms stagger so the right agent mounts.
    // The right agent's onAnimationComplete fires synchronously via ref mock,
    // scheduling its own 400ms bubble timer.
    await act(async () => {
      vi.advanceTimersByTime(1500 - BUBBLE_DELAY)
    })

    // Step 3: advance past the right agent's 400ms bubble delay.
    await act(async () => {
      vi.advanceTimersByTime(BUBBLE_DELAY)
    })

    const visibleNames = ALL_AGENT_NAMES.filter(
      (name) => screen.queryByText(`Hi, I'm ${name}!`) !== null,
    )
    // Both left and right agents should have their bubbles visible.
    expect(visibleNames.length).toBeGreaterThanOrEqual(2)
  })
})
