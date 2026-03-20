import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

interface Props {
  open: boolean
  onClose: () => void
  initialTab?: 'login' | 'signup'
  centered?: boolean
  onSuccess?: () => void
}

export default function AuthModal({ open, onClose, initialTab = 'login', centered = false, onSuccess }: Props) {
  const { login, register } = useAuth()
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTab(initialTab)
  }, [initialTab, open])

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      setEmail('')
      setPassword('')
      setUsername('')
      setFirstName('')
      setLastName('')
      setError('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (tab === 'login') {
        await login(username, password)
      } else {
        await register(username, email, password, firstName, lastName)
      }
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const modalContent = (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: centered ? 0 : -8, scale: centered ? 0.95 : 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: centered ? 0 : -8, scale: centered ? 0.95 : 1 }}
      transition={{ duration: 0.15 }}
      className={centered ? 'w-80 rounded-lg overflow-hidden z-50' : 'absolute right-0 top-full mt-2 w-80 rounded-lg overflow-hidden z-50'}
      style={{
        background: 'rgba(8,8,16,0.95)',
        border: '1px solid rgba(0,255,255,0.25)',
        boxShadow: '0 0 20px rgba(0,255,255,0.1), 0 10px 40px rgba(0,0,0,0.7)',
      }}
    >
      {/* Tabs */}
      <div className="flex border-b border-neonCyan/10">
        <button
          className="flex-1 py-2.5 text-xs font-mono uppercase tracking-wider transition-colors"
          style={{
            color: tab === 'login' ? '#00ffff' : 'rgba(255,255,255,0.4)',
            borderBottom: tab === 'login' ? '2px solid #00ffff' : '2px solid transparent',
            textShadow: tab === 'login' ? '0 0 8px #00ffff' : 'none',
          }}
          onClick={() => { setTab('login'); setError('') }}
        >
          Login
        </button>
        <button
          className="flex-1 py-2.5 text-xs font-mono uppercase tracking-wider transition-colors"
          style={{
            color: tab === 'signup' ? '#00ffff' : 'rgba(255,255,255,0.4)',
            borderBottom: tab === 'signup' ? '2px solid #00ffff' : '2px solid transparent',
            textShadow: tab === 'signup' ? '0 0 8px #00ffff' : 'none',
          }}
          onClick={() => { setTab('signup'); setError('') }}
        >
          Sign Up
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          className="input-neon"
        />
        {tab === 'signup' && (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="input-neon"
            />
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
                className="input-neon flex-1"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
                className="input-neon flex-1"
              />
            </div>
          </>
        )}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="input-neon"
        />

        {error && (
          <p className="text-xs font-mono" style={{ color: '#ff4444', textShadow: '0 0 6px rgba(255,68,68,0.4)' }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting} className="btn-neon text-sm py-2">
          {submitting ? 'Please wait...' : tab === 'login' ? 'Login' : 'Create Account'}
        </button>
      </form>
    </motion.div>
  )

  if (centered) {
    return (
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          >
            {modalContent}
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      {open && modalContent}
    </AnimatePresence>
  )
}
