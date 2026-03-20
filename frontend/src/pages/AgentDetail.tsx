import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Agent } from '../types'
import { fetchAgent, purchaseAgent, fetchAgentSummary } from '../api'

// Use mock data when API is unavailable (same source as Marketplace)
import { MOCK_AGENTS } from './Marketplace'

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const dim = size === 'md' ? 'w-4 h-4' : 'w-3 h-3'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <svg key={star} className={dim} viewBox="0 0 20 20" fill={star <= Math.round(rating) ? '#facc15' : 'rgba(255,255,255,0.1)'}>
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-xs text-white/50 font-mono ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [message, setMessage] = useState('')
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

  useEffect(() => {
    if (!id) return
    fetchAgent(Number(id))
      .then(setAgent)
      .catch(() => {
        // Fallback to mock data
        const mock = MOCK_AGENTS.find(a => a.id === Number(id))
        if (mock) setAgent(mock)
        else navigate('/')
      })
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handlePurchase = async (type: 'buy' | 'rent' | 'trial') => {
    if (!agent) return
    setPurchasing(true)
    try {
      const res = await purchaseAgent(agent.id, type)
      setMessage(res.message)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Purchase failed')
    } finally {
      setPurchasing(false)
    }
  }

  const handleSummary = async () => {
    if (!agent || summaryLoading) return
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

  if (loading) {
    return (
      <div className="cyber-grid-bg min-h-screen pt-16 flex items-center justify-center">
        <div className="text-neonCyan font-mono animate-pulse tracking-widest">LOADING AGENT...</div>
      </div>
    )
  }

  if (!agent) return null

  return (
    <main className="cyber-grid-bg min-h-screen pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs font-mono text-white/40 hover:text-neonCyan transition-colors mb-8 tracking-wider uppercase"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Marketplace
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-lg p-8"
        >
          {/* Header with avatar */}
          <div className="flex items-start gap-5 mb-6">
            <img
              src={agent.avatar}
              alt={agent.name}
              className="w-20 h-20 rounded-lg shrink-0"
              style={{ border: '1px solid rgba(0,255,255,0.2)', background: 'rgba(0,0,0,0.3)' }}
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1
                    className="text-2xl sm:text-3xl font-black tracking-tight mb-1"
                    style={{ color: '#00ffff', textShadow: '0 0 10px rgba(0,255,255,0.4)', fontFamily: "'Orbitron', sans-serif" }}
                  >
                    {agent.name}
                  </h1>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-white/40 font-mono">by {agent.developer}</span>
                    <span
                      className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5"
                      style={{ color: '#7f00ff', background: 'rgba(127,0,255,0.1)', border: '1px solid rgba(127,0,255,0.3)' }}
                    >
                      {agent.category}
                    </span>
                  </div>
                  <StarRating rating={agent.rating} size="md" />
                  <span className="text-[11px] text-white/30 font-mono ml-2">({agent.review_count} reviews)</span>
                </div>
                {agent.has_trial && (
                  <span
                    className="text-xs font-bold tracking-widest uppercase px-3 py-1"
                    style={{
                      color: '#00ffff',
                      background: 'rgba(0,255,255,0.1)',
                      border: '1px solid rgba(0,255,255,0.4)',
                      boxShadow: '0 0 10px rgba(0,255,255,0.2)',
                    }}
                  >
                    Free Trial
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-white/60 font-mono text-sm leading-relaxed mb-8">
            {agent.description}
          </p>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {[
              { label: 'Downloads', value: agent.download_count.toLocaleString() },
              { label: 'Buy Price', value: `$${agent.price}` },
              { label: 'Rent/mo', value: `$${agent.rental_rate}` },
              { label: 'Source Size', value: agent.source_size },
              { label: 'Language', value: agent.language },
              { label: 'License', value: agent.license },
            ].map(stat => (
              <div
                key={stat.label}
                className="p-3 rounded"
                style={{ background: 'rgba(0,255,255,0.03)', border: '1px solid rgba(0,255,255,0.08)' }}
              >
                <div className="text-[9px] text-white/25 font-mono uppercase tracking-widest mb-1">{stat.label}</div>
                <div className="text-sm font-bold font-mono text-white/80 truncate">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Last updated */}
          <div className="text-[11px] text-white/25 font-mono mb-6">
            Last updated: {agent.last_updated}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mb-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePurchase('buy')}
              disabled={purchasing}
              className="btn-neon flex-1 sm:flex-none min-w-32"
            >
              Buy ${agent.price}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handlePurchase('rent')}
              disabled={purchasing}
              className="btn-neon-purple flex-1 sm:flex-none min-w-32"
            >
              Rent ${agent.rental_rate}/mo
            </motion.button>
            {agent.has_trial && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePurchase('trial')}
                disabled={purchasing}
                className="flex-1 sm:flex-none min-w-32 px-6 py-2 font-bold tracking-widest uppercase text-sm cursor-pointer"
                style={{
                  color: '#00ff88',
                  border: '1px solid rgba(0,255,136,0.4)',
                  background: 'rgba(0,255,136,0.05)',
                  transition: 'all 0.3s ease',
                }}
              >
                Free Trial
              </motion.button>
            )}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSummary}
                disabled={summaryLoading}
                className="flex-1 sm:flex-none min-w-32 px-6 py-2 font-bold tracking-widest uppercase text-sm cursor-pointer"
                style={{
                  color: '#ff00ff',
                  border: '1px solid rgba(255,0,255,0.4)',
                  background: summaryLoading ? 'rgba(255,0,255,0.15)' : 'rgba(255,0,255,0.05)',
                  transition: 'all 0.3s ease',
                }}
              >
                {summaryLoading ? 'Generating...' : 'AI Summary'}
              </motion.button>

              {/* AI Summary popup bubble */}
              <AnimatePresence>
                {showSummary && (
                  <motion.div
                    ref={summaryRef}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 bottom-full mb-2 z-50 w-80 p-4 rounded-lg"
                    style={{
                      background: 'rgba(15,5,25,0.95)',
                      border: '1px solid rgba(255,0,255,0.3)',
                      backdropFilter: 'blur(16px)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.6), 0 0 15px rgba(255,0,255,0.15)',
                      maxHeight: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <button
                      onClick={() => setShowSummary(false)}
                      className="absolute top-2 right-2.5 text-white/30 hover:text-white/60 text-xs font-mono cursor-pointer z-10"
                    >
                      x
                    </button>
                    <div className="text-[9px] text-white/25 font-mono uppercase tracking-widest mb-2 shrink-0">AI Summary</div>
                    <div className="overflow-y-auto min-h-0 pr-3" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,0,255,0.3) transparent' }}>
                      {summaryLoading && (
                        <div className="text-sm text-white/40 font-mono animate-pulse">Generating...</div>
                      )}
                      {summaryError && (
                        <p className="text-sm text-red-400 font-mono">{summaryError}</p>
                      )}
                      {summary && (
                        <p className="text-sm text-white/60 font-mono leading-relaxed">{summary}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Status message */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-3 rounded text-sm font-mono"
              style={{
                background: 'rgba(0,255,136,0.08)',
                border: '1px solid rgba(0,255,136,0.3)',
                color: '#00ff88',
              }}
            >
              {message}
            </motion.div>
          )}
        </motion.div>

        {/* Comments section */}
        {agent.comments && agent.comments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass rounded-lg p-8 mt-6"
          >
            <h2
              className="text-lg font-bold tracking-tight mb-6"
              style={{ fontFamily: "'Orbitron', sans-serif", color: '#00ffff' }}
            >
              Reviews ({agent.comments.length})
            </h2>

            <div className="space-y-4">
              {agent.comments.map(comment => (
                <div
                  key={comment.id}
                  className="p-4 rounded-lg"
                  style={{ background: 'rgba(0,255,255,0.02)', border: '1px solid rgba(0,255,255,0.06)' }}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={comment.avatar}
                      alt={comment.user}
                      className="w-8 h-8 rounded-full shrink-0"
                      style={{ border: '1px solid rgba(0,255,255,0.15)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-neonCyan/80">{comment.user}</span>
                          <StarRating rating={comment.rating} />
                        </div>
                        <span className="text-[10px] text-white/20 font-mono shrink-0">{comment.date}</span>
                      </div>
                      <p className="text-xs text-white/50 font-mono leading-relaxed">{comment.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  )
}
