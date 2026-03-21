import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Agent } from '../types'
import { checkAgentName, fetchMyAgents } from '../api'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = ['NLP', 'Vision', 'Automation', 'Analytics', 'Security', 'DevOps', 'Data']

interface NewAgentForm {
  name: string
  description: string
  category: string
  price: string
  rentalPrice: string
  hasTrial: boolean
  version: string
}

const emptyForm: NewAgentForm = {
  name: '',
  description: '',
  category: '',
  price: '',
  rentalPrice: '',
  hasTrial: false,
  version: '1.0.0',
}

export default function Developer() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [myAgents, setMyAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  // Upload form state
  const [form, setForm] = useState<NewAgentForm>(emptyForm)
  const [avatarMode, setAvatarMode] = useState<'generate' | 'upload'>('generate')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [nameTaken, setNameTaken] = useState<boolean | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const sourceInputRef = useRef<HTMLInputElement>(null)
  const nameCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user) {
      navigate('/')
      return
    }
    fetchMyAgents()
      .then((agents) => {
        setMyAgents(agents)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, navigate])

  const handleNameChange = useCallback((val: string) => {
    setForm((f) => ({ ...f, name: val }))
    setNameTaken(null)
    if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current)
    if (val.length >= 2) {
      nameCheckTimer.current = setTimeout(() => {
        checkAgentName(val).then(setNameTaken).catch(() => setNameTaken(null))
      }, 400)
    }
  }, [])

  const generatedAvatar = form.name
    ? `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(form.name.replace(/\s+/g, ''))}&backgroundColor=7f00ff`
    : null

  const handleAvatarUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleSourceUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSourceFile(file)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    // Build FormData for multipart upload
    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('description', form.description)
    fd.append('category', form.category)
    fd.append('price', form.price)
    fd.append('rental_price', form.rentalPrice)
    fd.append('has_trial', String(form.hasTrial))
    fd.append('version', form.version)
    if (avatarMode === 'upload' && avatarFile) {
      fd.append('avatar', avatarFile)
    }
    if (sourceFile) {
      fd.append('source', sourceFile)
    }

    // TODO: wire to real API endpoint POST /api/agents
    await new Promise((r) => setTimeout(r, 1500))

    setSubmitting(false)
    setUploadSuccess(true)
    setTimeout(() => setUploadSuccess(false), 3000)
    setForm(emptyForm)
    setNameTaken(null)
    setAvatarFile(null)
    setAvatarPreview(null)
    setSourceFile(null)
  }, [form, avatarMode, avatarFile, sourceFile])

  const totalDownloads = myAgents.reduce((s, a) => s + a.download_count, 0)
  const totalEarnings = myAgents.reduce((s, a) => s + a.download_count * a.price, 0)
  const avgRating = myAgents.length
    ? myAgents.reduce((s, a) => s + a.rating, 0) / myAgents.length
    : 0

  if (loading) {
    return (
      <div className="cyber-grid-bg min-h-screen pt-16 flex items-center justify-center">
        <div className="text-neonCyan font-mono animate-pulse tracking-widest">LOADING DEVELOPER DASHBOARD...</div>
      </div>
    )
  }

  return (
    <main className="cyber-grid-bg min-h-screen pt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

        {/* Developer Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-lg p-8 mb-6"
        >
          <div className="flex items-center gap-5">
            <img
              src={`https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(user?.email ?? '')}&backgroundColor=7f00ff`}
              alt={user?.username}
              className="w-20 h-20 rounded-full shrink-0"
              style={{ border: '2px solid rgba(127,0,255,0.4)', background: 'rgba(0,0,0,0.3)' }}
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1
                  className="text-2xl sm:text-3xl font-black tracking-tight"
                  style={{ color: '#7f00ff', textShadow: '0 0 10px rgba(127,0,255,0.4)', fontFamily: "'Orbitron', sans-serif" }}
                >
                  {user?.first_name} {user?.last_name}
                </h1>
                <span
                  className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5"
                  style={{ color: '#7f00ff', background: 'rgba(127,0,255,0.1)', border: '1px solid rgba(127,0,255,0.4)' }}
                >
                  Developer
                </span>
              </div>
              <p className="text-sm font-mono text-white/50">@{user?.username}</p>
              <p className="text-xs font-mono text-white/30 mt-1">{user?.email}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6" style={{ borderTop: '1px solid rgba(127,0,255,0.15)' }}>
            <StatBox label="Agents" value={String(myAgents.length)} color="#7f00ff" />
            <StatBox label="Downloads" value={totalDownloads.toLocaleString()} color="#00ffff" />
            <StatBox label="Avg Rating" value={avgRating.toFixed(1)} color="#ff00ff" />
            <StatBox label="Earnings" value={`$${totalEarnings.toLocaleString()}`} color="#00ff88" />
          </div>
        </motion.div>

        {/* My Agents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-lg p-8 mb-6"
        >
          <h2
            className="text-lg font-bold tracking-tight mb-6"
            style={{ fontFamily: "'Orbitron', sans-serif", color: '#7f00ff' }}
          >
            My Agents ({myAgents.length})
          </h2>
          {myAgents.length === 0 ? (
            <p className="text-sm text-white/30 font-mono">No agents published yet. Upload your first agent below!</p>
          ) : (
            <div className="space-y-3">
              {myAgents.map((agent) => (
                <DevAgentRow key={agent.id} agent={agent} onClick={() => navigate(`/agents/${agent.id}`)} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Upload New Agent */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-lg p-8"
        >
          <h2
            className="text-lg font-bold tracking-tight mb-6"
            style={{ fontFamily: "'Orbitron', sans-serif", color: '#7f00ff' }}
          >
            Upload New Agent
          </h2>

          <AnimatePresence>
            {uploadSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-6 px-4 py-3 rounded-lg text-sm font-mono"
                style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88' }}
              >
                Agent uploaded successfully!
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic info row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-white/40 mb-1.5 tracking-wider uppercase">Agent Name</label>
                <div className="relative">
                  <input
                    className="input-neon w-full px-3 py-2 rounded text-sm font-mono"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="My Awesome Agent"
                    required
                    style={nameTaken === true ? { borderColor: '#ff4444' } : nameTaken === false && form.name.length >= 2 ? { borderColor: '#00ff88' } : {}}
                  />
                  {form.name.length >= 2 && nameTaken !== null && (
                    <span
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold tracking-wider"
                      style={{ color: nameTaken ? '#ff4444' : '#00ff88' }}
                    >
                      {nameTaken ? 'TAKEN' : 'AVAILABLE'}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-white/40 mb-1.5 tracking-wider uppercase">Category</label>
                <select
                  className="input-neon w-full px-3 py-2 rounded text-sm font-mono bg-transparent"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                >
                  <option value="" disabled>Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c.toLowerCase()} className="bg-[#020205]">{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-mono text-white/40 mb-1.5 tracking-wider uppercase">Description</label>
              <textarea
                className="input-neon w-full px-3 py-2 rounded text-sm font-mono resize-none"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What does your agent do?"
                required
              />
            </div>

            {/* Pricing row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono text-white/40 mb-1.5 tracking-wider uppercase">Price ($)</label>
                <input
                  className="input-neon w-full px-3 py-2 rounded text-sm font-mono"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="49.99"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-white/40 mb-1.5 tracking-wider uppercase">Rental Price ($)</label>
                <input
                  className="input-neon w-full px-3 py-2 rounded text-sm font-mono"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.rentalPrice}
                  onChange={(e) => setForm({ ...form, rentalPrice: e.target.value })}
                  placeholder="9.99"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-white/40 mb-1.5 tracking-wider uppercase">Version</label>
                <input
                  className="input-neon w-full px-3 py-2 rounded text-sm font-mono"
                  value={form.version}
                  onChange={(e) => setForm({ ...form, version: e.target.value })}
                  placeholder="1.0.0"
                />
              </div>
            </div>

            {/* Trial toggle */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                className="relative w-10 h-5 rounded-full transition-colors"
                style={{ background: form.hasTrial ? 'rgba(127,0,255,0.4)' : 'rgba(255,255,255,0.08)' }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                  style={{
                    left: form.hasTrial ? '22px' : '2px',
                    background: form.hasTrial ? '#7f00ff' : 'rgba(255,255,255,0.3)',
                    boxShadow: form.hasTrial ? '0 0 8px rgba(127,0,255,0.6)' : 'none',
                  }}
                />
              </div>
              <input
                type="checkbox"
                className="sr-only"
                checked={form.hasTrial}
                onChange={(e) => setForm({ ...form, hasTrial: e.target.checked })}
              />
              <span className="text-xs font-mono text-white/50 group-hover:text-white/70 transition-colors tracking-wider uppercase">
                Offer free trial
              </span>
            </label>

            {/* Avatar section */}
            <div>
              <label className="block text-xs font-mono text-white/40 mb-3 tracking-wider uppercase">Agent Avatar</label>
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setAvatarMode('generate')}
                  className="px-3 py-1.5 rounded text-xs font-mono tracking-wider uppercase transition-all"
                  style={{
                    color: avatarMode === 'generate' ? '#7f00ff' : 'rgba(255,255,255,0.4)',
                    background: avatarMode === 'generate' ? 'rgba(127,0,255,0.1)' : 'transparent',
                    border: `1px solid ${avatarMode === 'generate' ? 'rgba(127,0,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  Generate
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarMode('upload')}
                  className="px-3 py-1.5 rounded text-xs font-mono tracking-wider uppercase transition-all"
                  style={{
                    color: avatarMode === 'upload' ? '#7f00ff' : 'rgba(255,255,255,0.4)',
                    background: avatarMode === 'upload' ? 'rgba(127,0,255,0.1)' : 'transparent',
                    border: `1px solid ${avatarMode === 'upload' ? 'rgba(127,0,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  }}
                >
                  Upload
                </button>
              </div>

              {avatarMode === 'generate' ? (
                <div className="flex items-center gap-4">
                  {generatedAvatar ? (
                    <img
                      src={generatedAvatar}
                      alt="Generated avatar"
                      className="w-16 h-16 rounded-lg"
                      style={{ border: '1px solid rgba(127,0,255,0.3)', background: 'rgba(0,0,0,0.3)' }}
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center"
                      style={{ border: '1px dashed rgba(127,0,255,0.3)', background: 'rgba(0,0,0,0.2)' }}
                    >
                      <span className="text-[10px] font-mono text-white/20">?</span>
                    </div>
                  )}
                  <p className="text-xs font-mono text-white/30">
                    {form.name ? 'Avatar generated from agent name' : 'Type a name above to generate an avatar'}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Uploaded avatar"
                      className="w-16 h-16 rounded-lg object-cover"
                      style={{ border: '1px solid rgba(127,0,255,0.3)' }}
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center"
                      style={{ border: '1px dashed rgba(127,0,255,0.3)', background: 'rgba(0,0,0,0.2)' }}
                    >
                      <svg className="w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-3 py-1.5 rounded text-xs font-mono tracking-wider uppercase transition-all"
                      style={{ color: '#7f00ff', border: '1px solid rgba(127,0,255,0.3)', background: 'rgba(127,0,255,0.05)' }}
                    >
                      Choose Image
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                    {avatarFile && (
                      <p className="text-[10px] font-mono text-white/30 mt-1">{avatarFile.name}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Source code upload */}
            <div>
              <label className="block text-xs font-mono text-white/40 mb-3 tracking-wider uppercase">Source Code</label>
              <div
                className="rounded-lg p-6 text-center cursor-pointer transition-all hover:border-[rgba(127,0,255,0.5)]"
                style={{ border: '1px dashed rgba(127,0,255,0.25)', background: 'rgba(127,0,255,0.02)' }}
                onClick={() => sourceInputRef.current?.click()}
              >
                {sourceFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-5 h-5 shrink-0" style={{ color: '#7f00ff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-left">
                      <p className="text-sm font-mono text-white/70">{sourceFile.name}</p>
                      <p className="text-[10px] font-mono text-white/30">{(sourceFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSourceFile(null) }}
                      className="text-white/30 hover:text-red-400 transition-colors ml-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <svg className="w-8 h-8 mx-auto mb-2" style={{ color: 'rgba(127,0,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-xs font-mono text-white/30 mb-1">Click to upload source file</p>
                    <p className="text-[10px] font-mono text-white/20">.py, .js, .ts, .go, .zip, .tar.gz</p>
                  </>
                )}
                <input
                  ref={sourceInputRef}
                  type="file"
                  accept=".py,.js,.ts,.go,.rs,.zip,.tar.gz,.tgz"
                  className="hidden"
                  onChange={handleSourceUpload}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting || nameTaken === true || !form.name || !form.category || !form.description || !form.price}
                className="btn-neon-purple rounded text-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Uploading...
                  </span>
                ) : (
                  'Publish Agent'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </main>
  )
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center">
      <p className="text-xl sm:text-2xl font-black font-mono" style={{ color, textShadow: `0 0 10px ${color}40` }}>
        {value}
      </p>
      <p className="text-[10px] font-mono text-white/30 tracking-widest uppercase mt-1">{label}</p>
    </div>
  )
}

function DevAgentRow({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  const earnings = agent.download_count * agent.price

  return (
    <button
      onClick={onClick}
      className="relative overflow-hidden flex items-center gap-4 p-4 rounded-lg text-left transition-all w-full cursor-pointer hover:translate-x-1 group"
      style={{ background: 'rgba(127,0,255,0.03)', border: '1px solid rgba(127,0,255,0.08)' }}
    >
      <div
        className="absolute inset-0 rounded-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(127,0,255,0.12) 0%, transparent 70%)' }}
      />
      <img
        src={agent.avatar}
        alt={agent.name}
        className="w-12 h-12 rounded-lg shrink-0"
        style={{ border: '1px solid rgba(127,0,255,0.2)', background: 'rgba(0,0,0,0.3)' }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold font-mono text-white/80 truncate">{agent.name}</span>
          <span
            className="text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 shrink-0"
            style={{ color: '#7f00ff', background: 'rgba(127,0,255,0.1)', border: '1px solid rgba(127,0,255,0.3)' }}
          >
            {agent.category}
          </span>
        </div>
        <p className="text-xs font-mono text-white/30 truncate">{agent.description}</p>
      </div>
      <div className="hidden sm:flex items-center gap-6 shrink-0 text-right">
        <div>
          <p className="text-xs font-mono" style={{ color: '#00ffff' }}>{agent.download_count}</p>
          <p className="text-[9px] font-mono text-white/20 uppercase">Downloads</p>
        </div>
        <div>
          <p className="text-xs font-mono" style={{ color: '#ff00ff' }}>{agent.rating.toFixed(1)}</p>
          <p className="text-[9px] font-mono text-white/20 uppercase">Rating</p>
        </div>
        <div>
          <p className="text-xs font-mono" style={{ color: '#00ff88' }}>${earnings.toLocaleString()}</p>
          <p className="text-[9px] font-mono text-white/20 uppercase">Earned</p>
        </div>
      </div>
      <svg className="w-4 h-4 text-white/20 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}
