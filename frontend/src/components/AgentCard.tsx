import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import type { Agent } from '../types'
import { fetchAgentSummary } from '../api'

interface Props {
  agent: Agent
  index?: number
}

const CATEGORY_COLORS: Record<string, { text: string; glow: string; bg: string }> = {
  nlp: { text: '#00ffff', glow: 'rgba(0,255,255,0.4)', bg: 'rgba(0,255,255,0.07)' },
  vision: { text: '#7f00ff', glow: 'rgba(127,0,255,0.4)', bg: 'rgba(127,0,255,0.07)' },
  automation: { text: '#ff00ff', glow: 'rgba(255,0,255,0.4)', bg: 'rgba(255,0,255,0.07)' },
  analytics: { text: '#00ff88', glow: 'rgba(0,255,136,0.4)', bg: 'rgba(0,255,136,0.07)' },
  security: { text: '#ff4444', glow: 'rgba(255,68,68,0.4)', bg: 'rgba(255,68,68,0.07)' },
}

function getCategoryStyle(cat: string) {
  return CATEGORY_COLORS[cat.toLowerCase()] ?? { text: '#00ffff', glow: 'rgba(0,255,255,0.4)', bg: 'rgba(0,255,255,0.07)' }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <svg
          key={star}
          className="w-3 h-3"
          viewBox="0 0 20 20"
          fill={star <= Math.round(rating) ? '#facc15' : 'rgba(255,255,255,0.1)'}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-[10px] text-white/40 font-mono ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

export default function AgentCard({ agent, index = 0 }: Props) {
  const navigate = useNavigate()
  const catStyle = getCategoryStyle(agent.category)
  const [summary, setSummary] = useState<string | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const summaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showSummary) return
    const handleClick = (e: MouseEvent) => {
      if (summaryRef.current && !summaryRef.current.contains(e.target as Node)) {
        setShowSummary(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showSummary])

  const handleSummary = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (summary) {
      setShowSummary(prev => !prev)
      return
    }
    setSummaryLoading(true)
    setSummaryError(null)
    setShowSummary(true)
    try {
      const result = await fetchAgentSummary(agent)
      setSummary(result)
    } catch (err) {
      setSummaryError(err instanceof Error ? err.message : 'Failed to generate summary')
    } finally {
      setSummaryLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      whileHover={{ y: -4 }}
      onClick={() => navigate(`/agents/${agent.id}`)}
      className="agent-card rounded-lg p-5 cursor-pointer group"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(0,255,255,0.1)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Top row: avatar + name + trial badge */}
      <div className="flex items-start gap-3 mb-3">
        {agent.avatar && (
          <img
            src={agent.avatar}
            alt={agent.name}
            className="w-10 h-10 rounded shrink-0"
            style={{ border: `1px solid ${catStyle.text}33`, background: 'rgba(0,0,0,0.3)' }}
          />
        )}
        {!agent.avatar && (
          <div
            className="w-10 h-10 rounded shrink-0 flex items-center justify-center text-sm font-bold"
            style={{ border: `1px solid ${catStyle.text}33`, background: catStyle.bg, color: catStyle.text }}
          >
            {agent.name.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className="font-bold text-sm tracking-tight text-white group-hover:text-neonCyan transition-colors line-clamp-1"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              {agent.name}
            </h3>
            {agent.has_trial && (
              <motion.span
                animate={{
                  boxShadow: [
                    '0 0 4px #00ffff, 0 0 8px rgba(0,255,255,0.3)',
                    '0 0 8px #00ffff, 0 0 16px rgba(0,255,255,0.5)',
                    '0 0 4px #00ffff, 0 0 8px rgba(0,255,255,0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="shrink-0 text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-sm"
                style={{
                  background: 'rgba(0,255,255,0.08)',
                  border: '1px solid rgba(0,255,255,0.5)',
                  color: '#00ffff',
                }}
              >
                Trial
              </motion.span>
            )}
          </div>
          <div className="text-[10px] text-white/30 font-mono truncate">
            {agent.developer ? `by ${agent.developer}` : ''}
          </div>
        </div>
      </div>

      {/* Category + Rating row */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="inline-block text-[9px] font-bold tracking-widest uppercase px-2 py-0.5"
          style={{
            color: catStyle.text,
            background: catStyle.bg,
            border: `1px solid ${catStyle.text}33`,
            clipPath: 'polygon(6px 0%, 100% 0%, calc(100% - 6px) 100%, 0% 100%)',
          }}
        >
          {agent.category}
        </span>
        {agent.rating != null && <StarRating rating={agent.rating} />}
      </div>

      {/* Description */}
      <p className="text-[11px] text-white/40 font-mono line-clamp-2 mb-3 leading-relaxed">
        {agent.description}
      </p>

      {/* Stats grid (only shown if data available) */}
      {agent.source_size && (
        <div
          className="grid grid-cols-3 gap-2 mb-3 py-2 px-2 rounded"
          style={{ background: 'rgba(0,255,255,0.02)', border: '1px solid rgba(0,255,255,0.05)' }}
        >
          <div className="text-center">
            <div className="text-[9px] text-white/25 font-mono uppercase tracking-wider">Size</div>
            <div className="text-[11px] text-white/60 font-mono font-bold">{agent.source_size}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-white/25 font-mono uppercase tracking-wider">Lang</div>
            <div className="text-[11px] text-white/60 font-mono font-bold truncate">{agent.language}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] text-white/25 font-mono uppercase tracking-wider">License</div>
            <div className="text-[11px] text-white/60 font-mono font-bold">{agent.license}</div>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="h-px mb-3" style={{ background: 'linear-gradient(to right, rgba(0,255,255,0.15), transparent)' }} />

      {/* Price section */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-[9px] text-white/25 font-mono uppercase tracking-wider mb-0.5">Buy</div>
          <div
            className="text-lg font-black font-mono"
            style={{ color: '#00ffff', textShadow: '0 0 10px rgba(0,255,255,0.5)' }}
          >
            ${agent.price}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[9px] text-white/25 font-mono uppercase tracking-wider mb-0.5">Rent/mo</div>
          <div className="text-sm font-bold font-mono" style={{ color: 'rgba(127,0,255,0.9)' }}>
            ${agent.rental_rate ?? agent.rental_price ?? 0}
          </div>
        </div>
      </div>

      {/* Footer: downloads + reviews + comments + action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[10px] text-white/30 font-mono">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>{(agent.download_count ?? 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/30 font-mono">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{agent.review_count}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-white/30 font-mono">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span>{agent.rating > 0 ? agent.rating.toFixed(1) : '—'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 font-mono"
            style={{
              color: '#ff00ff',
              border: '1px solid rgba(255,0,255,0.3)',
              background: summaryLoading ? 'rgba(255,0,255,0.15)' : 'rgba(255,0,255,0.05)',
              transition: 'all 0.2s ease',
            }}
            onClick={handleSummary}
            disabled={summaryLoading}
          >
            {summaryLoading ? '...' : 'AI'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-[10px] font-bold tracking-widest uppercase px-3 py-1 font-mono"
            style={{
              color: '#00ffff',
              border: '1px solid rgba(0,255,255,0.3)',
              background: 'rgba(0,255,255,0.05)',
              transition: 'all 0.2s ease',
            }}
            onClick={e => {
              e.stopPropagation()
              navigate(`/agents/${agent.id}`)
            }}
          >
            View
          </motion.button>
        </div>
      </div>

      {/* AI Summary popup bubble */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            ref={summaryRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-3 bottom-16 z-50 p-3 rounded-lg"
            style={{
              background: 'rgba(15,5,25,0.95)',
              border: '1px solid rgba(255,0,255,0.3)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.6), 0 0 15px rgba(255,0,255,0.15)',
              maxHeight: '160px',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={e => { e.stopPropagation(); setShowSummary(false) }}
              className="absolute top-1.5 right-2 text-white/30 hover:text-white/60 text-xs font-mono cursor-pointer z-10"
            >
              x
            </button>
            <div className="text-[9px] text-white/25 font-mono uppercase tracking-widest mb-1.5 shrink-0">AI Summary</div>
            <div className="overflow-y-auto min-h-0 pr-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,0,255,0.3) transparent' }}>
              {summaryLoading && (
                <div className="text-[11px] text-white/40 font-mono animate-pulse">Generating...</div>
              )}
              {summaryError && (
                <div className="text-[11px] text-red-400 font-mono">{summaryError}</div>
              )}
              {summary && (
                <p className="text-[11px] text-white/60 font-mono leading-relaxed">{summary}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated border on hover */}
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, ${catStyle.glow} 0%, transparent 70%)`,
        }}
      />
    </motion.div>
  )
}
