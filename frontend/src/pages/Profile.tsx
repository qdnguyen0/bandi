import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Agent } from '../types'
import { fetchProfile, fetchAgent } from '../api'
import type { ProfileResponse } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Profile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileResponse | null>(null)
  const [purchasedAgents, setPurchasedAgents] = useState<(Agent & { purchaseType: string })[]>([])
  const [favoriteAgents, setFavoriteAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    fetchProfile()
      .then(async (data) => {
        setProfile(data)

        const purchased = await Promise.all(
          (data.purchases ?? []).map(async (p) => {
            const agent = await fetchAgent(p.agent_id)
            return { ...agent, purchaseType: p.type }
          })
        )
        setPurchasedAgents(purchased)

        const favs = await Promise.all(
          (data.favorite_ids ?? []).map((id) => fetchAgent(id))
        )
        setFavoriteAgents(favs)
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [user, navigate])

  if (loading) {
    return (
      <div className="cyber-grid-bg min-h-screen pt-16 flex items-center justify-center">
        <div className="text-neonCyan font-mono animate-pulse tracking-widest">LOADING PROFILE...</div>
      </div>
    )
  }

  if (!profile) return null

  const { user: profileUser } = profile
  const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(profileUser.email)}&backgroundColor=00ffff`
  const memberSince = new Date(profileUser.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  })

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

        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-lg p-8 mb-6"
        >
          <div className="flex items-center gap-5">
            <img
              src={avatarUrl}
              alt={profileUser.username}
              className="w-20 h-20 rounded-full shrink-0"
              style={{ border: '2px solid rgba(0,255,255,0.3)', background: 'rgba(0,0,0,0.3)' }}
            />
            <div>
              <h1
                className="text-2xl sm:text-3xl font-black tracking-tight mb-1"
                style={{ color: '#00ffff', textShadow: '0 0 10px rgba(0,255,255,0.4)', fontFamily: "'Orbitron', sans-serif" }}
              >
                {profileUser.first_name} {profileUser.last_name}
              </h1>
              <p className="text-sm font-mono text-white/50 mb-1">@{profileUser.username}</p>
              <p className="text-xs font-mono text-white/30">{profileUser.email}</p>
              <p className="text-xs font-mono text-white/20 mt-1">Member since {memberSince}</p>
            </div>
          </div>
        </motion.div>

        {/* Purchased Agents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-lg p-8 mb-6"
        >
          <h2
            className="text-lg font-bold tracking-tight mb-6"
            style={{ fontFamily: "'Orbitron', sans-serif", color: '#00ffff' }}
          >
            Purchased Agents ({purchasedAgents.length})
          </h2>
          {purchasedAgents.length === 0 ? (
            <p className="text-sm text-white/30 font-mono">No purchased agents yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {purchasedAgents.map((agent) => (
                <AgentMiniCard
                  key={agent.id}
                  agent={agent}
                  badge={agent.purchaseType === 'buy' ? 'Bought' : 'Rented'}
                  badgeColor={agent.purchaseType === 'buy' ? '#00ff88' : '#ff00ff'}
                  onClick={() => navigate(`/agents/${agent.id}`)}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Favorite Agents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-lg p-8"
        >
          <h2
            className="text-lg font-bold tracking-tight mb-6"
            style={{ fontFamily: "'Orbitron', sans-serif", color: '#00ffff' }}
          >
            Favorite Agents ({favoriteAgents.length})
          </h2>
          {favoriteAgents.length === 0 ? (
            <p className="text-sm text-white/30 font-mono">No favorite agents yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {favoriteAgents.map((agent) => (
                <AgentMiniCard
                  key={agent.id}
                  agent={agent}
                  onClick={() => navigate(`/agents/${agent.id}`)}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </main>
  )
}

function AgentMiniCard({
  agent,
  badge,
  badgeColor,
  onClick,
}: {
  agent: Agent
  badge?: string
  badgeColor?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 p-4 rounded-lg text-left transition-colors w-full cursor-pointer"
      style={{ background: 'rgba(0,255,255,0.03)', border: '1px solid rgba(0,255,255,0.08)' }}
    >
      <img
        src={agent.avatar}
        alt={agent.name}
        className="w-12 h-12 rounded-lg shrink-0"
        style={{ border: '1px solid rgba(0,255,255,0.2)', background: 'rgba(0,0,0,0.3)' }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold font-mono text-white/80 truncate">{agent.name}</span>
          {badge && (
            <span
              className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 shrink-0"
              style={{ color: badgeColor, background: `${badgeColor}15`, border: `1px solid ${badgeColor}40` }}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5"
            style={{ color: '#7f00ff', background: 'rgba(127,0,255,0.1)', border: '1px solid rgba(127,0,255,0.3)' }}
          >
            {agent.category}
          </span>
          <span className="text-xs font-mono text-white/40">${agent.price}</span>
        </div>
      </div>
    </button>
  )
}
