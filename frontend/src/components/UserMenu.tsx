import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!user) return null

  const avatarUrl = `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(user.email)}&backgroundColor=00ffff`

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-2 py-1 rounded transition-colors hover:bg-neonCyan/5"
      >
        <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full" style={{ border: '1px solid rgba(0,255,255,0.3)' }} />
        <span className="hidden sm:block text-xs font-mono text-white/70 max-w-[120px] truncate">
          {user.first_name} {user.last_name}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-2 w-52 glass-dark rounded-lg overflow-hidden z-50"
            style={{
              border: '1px solid rgba(0,255,255,0.2)',
              boxShadow: '0 0 20px rgba(0,255,255,0.1), 0 10px 40px rgba(0,0,0,0.6)',
            }}
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-neonCyan/10">
              <p className="text-sm font-mono font-bold text-white truncate">{user.first_name} {user.last_name}</p>
              <p className="text-xs font-mono text-white/40 truncate">@{user.username}</p>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <button
                className="w-full text-left px-4 py-2 text-xs font-mono text-white/60 hover:text-neonCyan hover:bg-neonCyan/5 transition-colors"
                onClick={() => { navigate('/profile'); setOpen(false) }}
              >
                Profile
              </button>
              <button
                className="w-full text-left px-4 py-2 text-xs font-mono text-white/60 hover:text-voltagePurple hover:bg-voltagePurple/5 transition-colors"
                onClick={() => { navigate('/developer'); setOpen(false) }}
              >
                Developer
              </button>
              <button
                className="w-full text-left px-4 py-2 text-xs font-mono text-white/60 hover:text-red-400 hover:bg-red-400/5 transition-colors"
                onClick={() => { logout(); setOpen(false) }}
              >
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
