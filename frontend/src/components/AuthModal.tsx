import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { checkUsername, checkEmail } from '../api'

interface Props {
  open: boolean
  onClose: () => void
  initialTab?: 'login' | 'signup'
  centered?: boolean
  onSuccess?: () => void
}

function useDebounce(fn: (...args: string[]) => void, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  return useCallback((...args: string[]) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(...args), delay)
  }, [fn, delay])
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
  const [usernameTaken, setUsernameTaken] = useState<boolean | null>(null)
  const [emailTaken, setEmailTaken] = useState<boolean | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const debouncedCheckUsername = useDebounce(useCallback((val: string) => {
    if (val.length < 2) { setUsernameTaken(null); return }
    checkUsername(val).then(setUsernameTaken).catch(() => setUsernameTaken(null))
  }, []), 400)

  const debouncedCheckEmail = useDebounce(useCallback((val: string) => {
    if (!val.includes('@')) { setEmailTaken(null); return }
    checkEmail(val).then(setEmailTaken).catch(() => setEmailTaken(null))
  }, []), 400)

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
      setUsernameTaken(null)
      setEmailTaken(null)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (tab === 'signup' && usernameTaken) {
      setError('Username is already taken')
      return
    }
    if (tab === 'signup' && emailTaken) {
      setError('Email is already registered')
      return
    }
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
        <div className="relative">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => {
              setUsername(e.target.value)
              if (tab === 'signup') {
                setUsernameTaken(null)
                debouncedCheckUsername(e.target.value)
              }
            }}
            required
            className="input-neon w-full"
            style={tab === 'signup' && usernameTaken === true ? { borderColor: '#ff4444' } : tab === 'signup' && usernameTaken === false && username.length >= 2 ? { borderColor: '#00ff88' } : {}}
          />
          {tab === 'signup' && username.length >= 2 && usernameTaken !== null && (
            <span
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold tracking-wider"
              style={{ color: usernameTaken ? '#ff4444' : '#00ff88' }}
            >
              {usernameTaken ? 'TAKEN' : 'AVAILABLE'}
            </span>
          )}
        </div>
        {tab === 'signup' && (
          <>
            <div className="relative">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  setEmailTaken(null)
                  debouncedCheckEmail(e.target.value)
                }}
                required
                className="input-neon w-full"
                style={emailTaken === true ? { borderColor: '#ff4444' } : emailTaken === false && email.includes('@') ? { borderColor: '#00ff88' } : {}}
              />
              {email.includes('@') && emailTaken !== null && (
                <span
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold tracking-wider"
                  style={{ color: emailTaken ? '#ff4444' : '#00ff88' }}
                >
                  {emailTaken ? 'TAKEN' : 'AVAILABLE'}
                </span>
              )}
            </div>
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

        <button
          type="submit"
          disabled={submitting || (tab === 'signup' && usernameTaken === true) || (tab === 'signup' && emailTaken === true)}
          className="btn-neon text-sm py-2"
        >
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
