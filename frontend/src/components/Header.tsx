import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'

export default function Header({ onSearchOpen }: { onSearchOpen: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-neonCyan/10">
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-neonCyan to-transparent opacity-50" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-4 group">
            <div className="relative">
              {/* Glitch logo */}
              <span
                className="glitch text-2xl font-black tracking-tighter text-neonCyan"
                data-text="BandiAI"
                style={{
                  textShadow: '0 0 7px #00ffff, 0 0 14px #00ffff, 0 0 28px #00ffff',
                  fontFamily: "'Orbitron', sans-serif",
                  letterSpacing: '-0.05em',
                }}
              >
                BandiAI
              </span>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-xs text-neonCyan/40 tracking-widest uppercase font-mono">
                AI Agent Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `text-sm tracking-wider uppercase font-mono transition-all duration-200 ${
                  isActive
                    ? 'text-neonCyan'
                    : 'text-white/50 hover:text-neonCyan'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { textShadow: '0 0 8px #00ffff' }
                  : {}
              }
            >
              Marketplace
            </NavLink>
            <NavLink
              to="/agents"
              className={({ isActive }) =>
                `text-sm tracking-wider uppercase font-mono transition-all duration-200 ${
                  isActive
                    ? 'text-neonCyan'
                    : 'text-white/50 hover:text-neonCyan'
                }`
              }
            >
              Browse
            </NavLink>
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Search shortcut */}
            <button
              onClick={onSearchOpen}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono text-neonCyan/50 hover:text-neonCyan transition-colors"
              style={{ border: '1px solid rgba(0,255,255,0.15)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search</span>
              <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.2)' }}>
                ⌘K
              </kbd>
            </button>

            {/* Auth buttons */}
            <button className="btn-neon text-xs py-1.5 px-4">
              Connect
            </button>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden text-neonCyan/60 hover:text-neonCyan"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden glass-dark border-t border-neonCyan/10 px-4 py-3">
          <nav className="flex flex-col gap-3">
            <NavLink
              to="/"
              className="text-sm tracking-wider uppercase font-mono text-white/60 hover:text-neonCyan transition-colors"
              onClick={() => setMenuOpen(false)}
            >
              Marketplace
            </NavLink>
            <button
              onClick={() => { onSearchOpen(); setMenuOpen(false) }}
              className="text-left text-sm tracking-wider uppercase font-mono text-white/60 hover:text-neonCyan transition-colors"
            >
              Search
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
