import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { AuthProvider } from './context/AuthContext'
import Header from './components/Header'
import SearchPalette from './components/SearchPalette'
import Marketplace from './pages/Marketplace'
import AgentDetail from './pages/AgentDetail'
import Profile from './pages/Profile'

export default function App() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery] = useState('')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(open => !open)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <AuthProvider>
      <BrowserRouter>
        <Header onSearchOpen={() => setSearchOpen(true)} />
        <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
        <Routes>
          <Route path="/" element={<Marketplace searchQuery={searchQuery} />} />
          <Route path="/agents" element={<Marketplace searchQuery={searchQuery} />} />
          <Route path="/agents/:id" element={<AgentDetail />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
