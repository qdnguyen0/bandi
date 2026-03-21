import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Agent } from '../types'
import { fetchAgents } from '../api'

type SortKey = 'downloads' | 'rating' | 'reviews'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'downloads', label: 'Most Downloaded' },
  { key: 'rating', label: 'Highest Rated' },
  { key: 'reviews', label: 'Most Reviewed' },
]

const TROPHY: Record<number, { emoji: string; color: string; glow: string; hoverGlow: string; label: string }> = {
  0: { emoji: '\uD83C\uDFC6', color: '#ffd700', glow: 'rgba(255,215,0,0.4)', hoverGlow: 'rgba(255,215,0,0.8)', label: '1st' },
  1: { emoji: '\uD83E\uDD48', color: '#c0c0c0', glow: 'rgba(192,192,192,0.35)', hoverGlow: 'rgba(192,192,192,0.7)', label: '2nd' },
  2: { emoji: '\uD83E\uDD49', color: '#cd7f32', glow: 'rgba(205,127,50,0.35)', hoverGlow: 'rgba(205,127,50,0.7)', label: '3rd' },
}

function sortAgents(agents: Agent[], key: SortKey): Agent[] {
  return [...agents].sort((a, b) => {
    if (key === 'downloads') return b.download_count - a.download_count
    if (key === 'rating') return b.rating - a.rating
    return b.review_count - a.review_count
  })
}

function getSortValue(agent: Agent, key: SortKey): string {
  if (key === 'downloads') return agent.download_count.toLocaleString()
  if (key === 'rating') return agent.rating.toFixed(1)
  return String(agent.review_count)
}

function getSortLabel(key: SortKey): string {
  if (key === 'downloads') return 'Downloads'
  if (key === 'rating') return 'Rating'
  return 'Reviews'
}

export default function TopAgents() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('downloads')

  useEffect(() => {
    fetchAgents({ limit: 50, page: 1 })
      .then(async (res) => {
        let all = res.agents
        // Fetch remaining pages to get all agents for ranking
        const totalPages = Math.ceil(res.total / res.limit)
        for (let p = 2; p <= totalPages; p++) {
          const next = await fetchAgents({ limit: 50, page: p })
          all = all.concat(next.agents)
        }
        setAgents(all)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const sorted = sortAgents(agents, sortKey)

  if (loading) {
    return (
      <div className="cyber-grid-bg min-h-screen pt-16 flex items-center justify-center">
        <div className="text-neonCyan font-mono animate-pulse tracking-widest">LOADING LEADERBOARD...</div>
      </div>
    )
  }

  return (
    <main className="cyber-grid-bg min-h-screen pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1
            className="text-3xl sm:text-4xl font-black tracking-tight mb-2"
            style={{ color: '#00ffff', textShadow: '0 0 14px rgba(0,255,255,0.5)', fontFamily: "'Orbitron', sans-serif" }}
          >
            Top Agents
          </h1>
          <p className="text-sm font-mono text-white/40">
            The best AI agents ranked by the community
          </p>
        </motion.div>

        {/* Sort tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex justify-center gap-2 mb-8"
        >
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSortKey(opt.key)}
              className="px-4 py-2 rounded text-xs font-mono tracking-wider uppercase transition-all duration-200 cursor-pointer"
              style={
                sortKey === opt.key
                  ? {
                      color: '#00ffff',
                      background: 'rgba(0,255,255,0.1)',
                      border: '1px solid rgba(0,255,255,0.4)',
                      boxShadow: '0 0 10px rgba(0,255,255,0.2)',
                    }
                  : {
                      color: 'rgba(255,255,255,0.4)',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }
              }
            >
              {opt.label}
            </button>
          ))}
        </motion.div>

        {/* Podium — top 3 */}
        {sorted.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3 mb-8"
          >
            {/* 2nd place (left) */}
            <PodiumCard agent={sorted[1]} rank={1} sortKey={sortKey} onClick={() => navigate(`/agents/${sorted[1].id}`)} />
            {/* 1st place (center, taller) */}
            <PodiumCard agent={sorted[0]} rank={0} sortKey={sortKey} onClick={() => navigate(`/agents/${sorted[0].id}`)} />
            {/* 3rd place (right) */}
            <PodiumCard agent={sorted[2]} rank={2} sortKey={sortKey} onClick={() => navigate(`/agents/${sorted[2].id}`)} />
          </motion.div>
        )}

        {/* Leaderboard list — rest */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-lg overflow-hidden"
        >
          {sorted.slice(3).map((agent, i) => (
            <button
              key={agent.id}
              onClick={() => navigate(`/agents/${agent.id}`)}
              className="relative overflow-hidden flex items-center gap-4 w-full text-left px-5 py-4 transition-colors cursor-pointer group"
              style={{
                borderBottom: i < sorted.length - 4 ? '1px solid rgba(0,255,255,0.06)' : undefined,
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,255,255,0.16) 0%, transparent 70%)' }}
              />
              {/* Rank */}
              <span className="text-lg font-bold font-mono text-white/20 w-8 text-center shrink-0">
                {i + 4}
              </span>

              {/* Avatar */}
              <img
                src={agent.avatar}
                alt={agent.name}
                className="w-10 h-10 rounded-lg shrink-0"
                style={{ border: '1px solid rgba(0,255,255,0.15)', background: 'rgba(0,0,0,0.3)' }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono text-white/80 truncate">{agent.name}</span>
                  <span
                    className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 shrink-0"
                    style={{ color: '#7f00ff', background: 'rgba(127,0,255,0.1)', border: '1px solid rgba(127,0,255,0.3)' }}
                  >
                    {agent.category}
                  </span>
                </div>
              </div>

              {/* Sort value */}
              <div className="text-right shrink-0">
                <div className="text-sm font-bold font-mono text-white/70">{getSortValue(agent, sortKey)}</div>
                <div className="text-[9px] font-mono text-white/25 uppercase tracking-widest">{getSortLabel(sortKey)}</div>
              </div>
            </button>
          ))}
        </motion.div>
      </div>
    </main>
  )
}

function PodiumCard({
  agent,
  rank,
  sortKey,
  onClick,
}: {
  agent: Agent
  rank: number
  sortKey: SortKey
  onClick: () => void
}) {
  const trophy = TROPHY[rank]
  const isGold = rank === 0

  return (
    <button
      onClick={onClick}
      className="relative overflow-hidden flex flex-col items-center text-center p-4 sm:p-6 rounded-lg transition-all duration-200 cursor-pointer hover:scale-[1.02] group"
      style={{
        background: `linear-gradient(180deg, ${trophy.glow} 0%, rgba(0,0,0,0) 60%)`,
        border: `1px solid ${trophy.color}40`,
        boxShadow: isGold ? `0 0 25px ${trophy.glow}` : `0 0 12px ${trophy.glow}`,
        marginTop: isGold ? 0 : '1.5rem',
      }}
    >
      <div
        className="absolute inset-0 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${trophy.hoverGlow} 0%, transparent 70%)` }}
      />
      {/* Trophy */}
      <span className="text-3xl sm:text-4xl mb-2" style={{ filter: `drop-shadow(0 0 8px ${trophy.glow})` }}>
        {trophy.emoji}
      </span>

      {/* Rank label */}
      <span
        className="text-[10px] font-bold font-mono tracking-widest uppercase mb-3"
        style={{ color: trophy.color }}
      >
        {trophy.label}
      </span>

      {/* Avatar */}
      <img
        src={agent.avatar}
        alt={agent.name}
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg mb-3"
        style={{ border: `2px solid ${trophy.color}60`, background: 'rgba(0,0,0,0.3)' }}
      />

      {/* Name */}
      <span className="text-xs sm:text-sm font-bold font-mono text-white/90 mb-1 line-clamp-2">{agent.name}</span>

      {/* Category */}
      <span
        className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 mb-3"
        style={{ color: '#7f00ff', background: 'rgba(127,0,255,0.1)', border: '1px solid rgba(127,0,255,0.3)' }}
      >
        {agent.category}
      </span>

      {/* Stat */}
      <div className="mt-auto">
        <div className="text-lg sm:text-xl font-black font-mono" style={{ color: trophy.color, textShadow: `0 0 8px ${trophy.glow}` }}>
          {getSortValue(agent, sortKey)}
        </div>
        <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest">{getSortLabel(sortKey)}</div>
      </div>
    </button>
  )
}
