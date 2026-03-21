import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

interface PeekAgent {
  id: number
  name: string
  category: string
  bgColor: string
  tagline: string
  capabilities: [string, string, string]
}

const PEEK_AGENTS: PeekAgent[] = [
  { id: 1, name: 'NeuralScribe', category: 'nlp', bgColor: '00ffff',
    tagline: "I turn words into magic.", capabilities: ['summarization', 'chain-of-thought', 'doc generation'] },
  { id: 2, name: 'VisionCore', category: 'vision', bgColor: '7f00ff',
    tagline: "I see what you can't.", capabilities: ['object detection', 'OCR', 'image QA'] },
  { id: 3, name: 'AutoFlow', category: 'automation', bgColor: 'ff00ff',
    tagline: "I automate the boring stuff.", capabilities: ['API orchestration', 'DAG builder', 'retry logic'] },
  { id: 4, name: 'DataPulse', category: 'analytics', bgColor: '00ff88',
    tagline: "I predict before it happens.", capabilities: ['anomaly detection', 'forecasting', 'BI dashboards'] },
  { id: 5, name: 'CipherGuard', category: 'security', bgColor: 'ff4444',
    tagline: "I catch what slips through.", capabilities: ['SAST scanning', 'secrets detection', 'SOC2 reports'] },
  { id: 6, name: 'LangBridge', category: 'nlp', bgColor: '00ffff',
    tagline: "100 languages, zero friction.", capabilities: ['neural translation', 'tone control', 'streaming'] },
  { id: 7, name: 'PixelForge', category: 'vision', bgColor: '7f00ff',
    tagline: "I make pixels obey.", capabilities: ['inpainting', 'style transfer', 'upscaling'] },
  { id: 8, name: 'PipelinePilot', category: 'automation', bgColor: 'ff00ff',
    tagline: "Ship faster. Break less.", capabilities: ['CI/CD generation', 'GitLab CI', 'auto-rollback'] },
]

const CATEGORY_COLORS: Record<string, { text: string; glow: string; border: string }> = {
  nlp: { text: '#00ffff', glow: 'rgba(0,255,255,0.4)', border: 'rgba(0,255,255,0.35)' },
  vision: { text: '#7f00ff', glow: 'rgba(127,0,255,0.4)', border: 'rgba(127,0,255,0.35)' },
  automation: { text: '#ff00ff', glow: 'rgba(255,0,255,0.4)', border: 'rgba(255,0,255,0.35)' },
  analytics: { text: '#00ff88', glow: 'rgba(0,255,136,0.4)', border: 'rgba(0,255,136,0.35)' },
  security: { text: '#ff4444', glow: 'rgba(255,68,68,0.4)', border: 'rgba(255,68,68,0.35)' },
}

function getCategoryColors(category: string) {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS.nlp
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

type Side = 'left' | 'right'

interface PeekHeadProps {
  agent: PeekAgent
  side: Side
  topPct: number
  onExited: () => void
}

function PeekHead({ agent, side, topPct, onExited }: PeekHeadProps) {
  const navigate = useNavigate()
  const colors = getCategoryColors(agent.category)
  const [phase, setPhase] = useState<'entering' | 'visible' | 'exiting'>('entering')
  const [showBubble, setShowBubble] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bubbleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isLeft = side === 'left'

  const handleEnterComplete = useCallback(() => {
    if (phase !== 'entering') return
    setPhase('visible')
    bubbleTimerRef.current = setTimeout(() => {
      setShowBubble(true)
    }, 400)
    timerRef.current = setTimeout(() => {
      setShowBubble(false)
      setTimeout(() => setPhase('exiting'), 150)
    }, 7500 + Math.random() * 1000)
  }, [phase])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
      if (bubbleTimerRef.current !== null) clearTimeout(bubbleTimerRef.current)
    }
  }, [])

  // The avatar is 144px. We want ~20% off-screen (≈29px).
  // x=0 means the group's edge is flush with the screen edge (fully visible).
  // Shift by -29/+29 to hide 20% of the avatar behind the edge.
  const xHidden = isLeft ? -160 : 160
  const xVisible = isLeft ? -29 : 29
  const xTarget = phase === 'exiting' ? xHidden : xVisible

  // Randomised sneaky enter animation — computed once at mount
  const enterAnimation = useMemo(() => {
    const sign = isLeft ? 1 : -1
    const range = 131 // |xVisible - xHidden|
    // Two random stop positions along the journey (30–45% and 55–75%)
    const pct1 = 0.30 + Math.random() * 0.15
    const pct2 = 0.55 + Math.random() * 0.20
    const mid1 = xHidden + sign * pct1 * range
    const mid2 = xHidden + sign * pct2 * range
    // Random timing: when each move ends and pause ends
    const t1 = 0.16 + Math.random() * 0.08          // end of 1st move
    const t2 = t1 + 0.14 + Math.random() * 0.12     // end of 1st pause
    const t3 = t2 + 0.12 + Math.random() * 0.08     // end of 2nd move
    const t4 = t3 + 0.08 + Math.random() * 0.10     // end of 2nd pause
    return {
      x: [xHidden, mid1, mid1, mid2, mid2, xVisible] as number[],
      times: [0, t1, t2, t3, t4, 1] as number[],
      duration: 4.5 + Math.random() * 2,             // 4.5–6.5 s
    }
  }, [isLeft, xHidden, xVisible])

  const avatarRotation = isLeft ? 'rotate(30deg)' : 'rotate(-30deg)'

  const topStr = `${topPct}%`

  return (
    <motion.div
      initial={{ x: xHidden }}
      animate={phase === 'entering' ? { x: enterAnimation.x } : { x: xTarget }}
      transition={
        phase === 'exiting'
          ? { duration: 0.35, ease: 'easeIn' }
          : phase === 'entering'
          ? { duration: enterAnimation.duration, times: enterAnimation.times, ease: 'easeOut' }
          : { duration: 0 }
      }
      onAnimationComplete={() => {
        if (phase === 'entering') {
          handleEnterComplete()
        } else if (phase === 'exiting') {
          onExited()
        }
      }}
      onClick={() => navigate(`/agents/${agent.id}`)}
      style={{
        position: 'absolute',
        top: topStr,
        [isLeft ? 'left' : 'right']: 0,
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: isLeft ? 'row' : 'row-reverse',
        alignItems: 'center',
        pointerEvents: 'auto',
        cursor: 'pointer',
      }}
    >
      {/* Robot head avatar */}
      <div
        style={{
          flexShrink: 0,
          width: 144,
          height: 144,
          borderRadius: '50%',
          background: 'rgba(2,2,5,0.9)',
          border: `3px solid ${colors.text}`,
          boxShadow: `0 0 18px ${colors.glow}, 0 0 36px ${colors.glow}`,
          overflow: 'hidden',
          transform: avatarRotation,
        }}
      >
        <img
          src={`https://api.dicebear.com/9.x/bottts/svg?seed=${agent.name}&backgroundColor=${agent.bgColor}`}
          alt={agent.name}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>

      {/* Speech bubble */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{
              position: 'relative',
              overflow: 'hidden',
              maxWidth: 180,
              background: 'rgba(2,2,5,0.92)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              padding: '10px 12px',
              marginLeft: isLeft ? 10 : 0,
              marginRight: isLeft ? 0 : 10,
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 10,
                pointerEvents: 'none',
                background: `radial-gradient(ellipse at 50% 0%, ${colors.glow} 0%, transparent 70%)`,
                opacity: 1,
              }}
            />
            {/* Bubble tail */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                [isLeft ? 'left' : 'right']: -8,
                transform: 'translateY(-50%)',
                width: 0,
                height: 0,
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
                ...(isLeft
                  ? { borderRight: `8px solid ${colors.border}` }
                  : { borderLeft: `8px solid ${colors.border}` }),
              }}
            />

            {/* Line 1: name */}
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                color: colors.text,
                letterSpacing: '0.05em',
                marginBottom: 4,
              }}
            >
              Hi, I'm {agent.name}!
            </div>

            {/* Line 2: tagline */}
            <div
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.6)',
                fontFamily: 'monospace',
                fontStyle: 'italic',
                marginBottom: 6,
              }}
            >
              {agent.tagline}
            </div>

            {/* Line 3: capability chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {agent.capabilities.map(cap => (
                <span
                  key={cap}
                  style={{
                    fontSize: 9,
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 4,
                    padding: '1px 5px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cap}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function randomTop() {
  // 15%–77% of the wrapper height keeps heads away from the very edges
  return Math.floor(Math.random() * 62) + 15
}

export default function PeekingAgents() {
  const queueRef = useRef<PeekAgent[]>([])

  const [leftAgent, setLeftAgent] = useState<PeekAgent | null>(null)
  const [rightAgent, setRightAgent] = useState<PeekAgent | null>(null)
  const [leftKey, setLeftKey] = useState(0)
  const [rightKey, setRightKey] = useState(0)
  const [leftTop, setLeftTop] = useState(randomTop)
  const [rightTop, setRightTop] = useState(randomTop)

  const getNextAgent = useCallback((exclude?: number): PeekAgent => {
    if (queueRef.current.length === 0) {
      queueRef.current = shuffleArray(PEEK_AGENTS)
    }
    let idx = 0
    if (exclude !== undefined) {
      const notExcluded = queueRef.current.findIndex(a => a.id !== exclude)
      if (notExcluded !== -1) idx = notExcluded
    }
    const [agent] = queueRef.current.splice(idx, 1)
    return agent
  }, [])

  useEffect(() => {
    const leftFirst = getNextAgent()
    setLeftAgent(leftFirst)
    setLeftKey(k => k + 1)

    const t = setTimeout(() => {
      const rightFirst = getNextAgent(leftFirst.id)
      setRightAgent(rightFirst)
      setRightKey(k => k + 1)
    }, 3000)

    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLeftExited = useCallback(() => {
    const t = setTimeout(() => {
      const next = getNextAgent(rightAgent?.id)
      setLeftAgent(next)
      setLeftTop(randomTop())
      setLeftKey(k => k + 1)
    }, 1000)
    return () => clearTimeout(t)
  }, [getNextAgent, rightAgent])

  const handleRightExited = useCallback(() => {
    const t = setTimeout(() => {
      const next = getNextAgent(leftAgent?.id)
      setRightAgent(next)
      setRightTop(randomTop())
      setRightKey(k => k + 1)
    }, 1000)
    return () => clearTimeout(t)
  }, [getNextAgent, leftAgent])

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 40,
        overflow: 'visible',
      }}
      aria-hidden="true"
    >
      <AnimatePresence>
        {leftAgent && (
          <PeekHead
            key={`left-${leftKey}`}
            agent={leftAgent}
            side="left"
            topPct={leftTop}
            onExited={handleLeftExited}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {rightAgent && (
          <PeekHead
            key={`right-${rightKey}`}
            agent={rightAgent}
            side="right"
            topPct={rightTop}
            onExited={handleRightExited}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
