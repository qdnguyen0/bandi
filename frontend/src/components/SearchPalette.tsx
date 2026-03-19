import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { AgentSuggestion } from '../api'
import { suggestAgents } from '../api'

interface Props {
  open: boolean
  onClose: () => void
}

export default function SearchPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AgentSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const suggestions = await suggestAgents(q, 8)
      setResults(suggestions)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200)
    return () => clearTimeout(timer)
  }, [query, search])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults([])
      setSelected(0)
    }
  }, [open])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected(s => Math.min(s + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected(s => Math.max(s - 1, 0))
    } else if (e.key === 'Enter' && results[selected]) {
      navigate(`/agents/${results[selected].id}`)
      onClose()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(2,2,5,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="fixed top-24 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 px-4"
          >
            <div
              className="glass-dark rounded-lg overflow-hidden"
              style={{
                border: '1px solid rgba(0,255,255,0.3)',
                boxShadow: '0 0 30px rgba(0,255,255,0.15), 0 20px 60px rgba(0,0,0,0.8)',
              }}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-neonCyan/10">
                <svg className="w-4 h-4 text-neonCyan/60 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelected(0) }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search agents..."
                  className="flex-1 bg-transparent text-white text-sm font-mono outline-none placeholder-neonCyan/25"
                />
                {loading && (
                  <div className="w-4 h-4 border border-neonCyan/40 border-t-neonCyan rounded-full animate-spin" />
                )}
                <kbd
                  className="px-1.5 py-0.5 text-[10px] font-mono text-neonCyan/40"
                  style={{ border: '1px solid rgba(0,255,255,0.15)', borderRadius: '3px' }}
                >
                  ESC
                </kbd>
              </div>

              {/* Results */}
              {results.length > 0 && (
                <ul className="py-2 max-h-80 overflow-y-auto">
                  {results.map((agent, i) => (
                    <li key={agent.id}>
                      <button
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                        style={{
                          background: i === selected ? 'rgba(0,255,255,0.07)' : 'transparent',
                          borderLeft: i === selected ? '2px solid #00ffff' : '2px solid transparent',
                        }}
                        onMouseEnter={() => setSelected(i)}
                        onClick={() => {
                          navigate(`/agents/${agent.id}`)
                          onClose()
                        }}
                      >
                        {/* Category dot */}
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: categoryColor(agent.category) }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-mono font-bold text-white truncate">
                            {agent.name}
                          </div>
                          <div className="text-xs text-white/40 truncate">{agent.category}</div>
                        </div>
                        <div className="text-xs font-mono text-neonCyan/60 shrink-0">
                          ${agent.price}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Empty state */}
              {query && !loading && results.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm font-mono text-white/30">
                    No agents found for <span className="text-neonCyan/50">"{query}"</span>
                  </p>
                </div>
              )}

              {/* Hint */}
              {!query && (
                <div className="px-4 py-3 border-t border-neonCyan/10">
                  <p className="text-[11px] font-mono text-white/20 text-center tracking-wider">
                    TYPE TO SEARCH · ↑↓ NAVIGATE · ENTER SELECT · ESC CLOSE
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function categoryColor(category: string): string {
  const map: Record<string, string> = {
    'nlp': '#00ffff',
    'vision': '#7f00ff',
    'automation': '#ff00ff',
    'analytics': '#00ff88',
    'security': '#ff4444',
  }
  return map[category.toLowerCase()] ?? '#00ffff'
}
