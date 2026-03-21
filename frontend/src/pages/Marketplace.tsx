import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AgentCard from '../components/AgentCard'
import PeekingAgents from '../components/PeekingAgents'
import type { Agent } from '../types'
import { fetchAgents } from '../api'

const CATEGORIES = ['All', 'NLP', 'Vision', 'Automation', 'Analytics', 'Security', 'DevOps', 'Data']
const PAGE_SIZE = 15

// Mock data for when the API is unavailable (dev/demo)
export const MOCK_AGENTS: Agent[] = [
  {
    id: 1,
    name: 'NeuralScribe Pro',
    description: 'Advanced language model agent for document generation, summarization, and intelligent text transformation. Supports GPT-style prompting, chain-of-thought reasoning, and structured output formatting for enterprise workflows.',
    category: 'NLP',
    price: 49,
    rental_rate: 9,
    has_trial: true,
    download_count: 12847,
    creator_id: 1,
    created_at: '2025-08-15',
    avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=NeuralScribe&backgroundColor=00ffff',
    developer: 'SynthLabs AI',
    rating: 4.8,
    review_count: 342,
    source_size: '2.4 MB',
    language: 'Python',
    license: 'MIT',
    last_updated: '2026-03-01',
    comments: [
      { id: 1, user: 'neo_coder', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=neo', text: 'Best NLP agent I have used. The summarization quality is insane.', rating: 5, date: '2026-02-28' },
      { id: 2, user: 'data_witch', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=witch', text: 'Solid for document generation. Could use better streaming support.', rating: 4, date: '2026-02-15' },
      { id: 3, user: 'ml_ronin', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ronin', text: 'Handles complex prompts gracefully. Worth every penny.', rating: 5, date: '2026-01-20' },
    ],
  },
  {
    id: 2,
    name: 'VisionCore X',
    description: 'Real-time image analysis and object detection agent with multimodal understanding capabilities. Supports YOLO-based detection, OCR, image segmentation, and visual question answering with sub-100ms latency.',
    category: 'Vision',
    price: 79,
    rental_rate: 14,
    has_trial: false,
    download_count: 8321,
    creator_id: 2,
    created_at: '2025-09-01',
    avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=VisionCore&backgroundColor=7f00ff',
    developer: 'PixelMind Inc',
    rating: 4.5,
    review_count: 189,
    source_size: '18.7 MB',
    language: 'Python / C++',
    license: 'Apache 2.0',
    last_updated: '2026-02-20',
    comments: [
      { id: 4, user: 'cv_empress', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=empress', text: 'Detection accuracy is top-tier. Latency could be better on CPU.', rating: 4, date: '2026-03-10' },
      { id: 5, user: 'robo_sam', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=sam', text: 'Excellent multimodal support. Integrated into our pipeline in minutes.', rating: 5, date: '2026-02-05' },
    ],
  },
  {
    id: 3,
    name: 'AutoFlow Agent',
    description: 'Intelligent workflow automation agent that orchestrates multi-step tasks across APIs, databases, and cloud services. Features a visual DAG builder, retry logic, and real-time execution monitoring with Slack/Discord alerts.',
    category: 'Automation',
    price: 39,
    rental_rate: 7,
    has_trial: true,
    download_count: 21053,
    creator_id: 3,
    created_at: '2025-07-20',
    avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=AutoFlow&backgroundColor=ff00ff',
    developer: 'FlowState Dev',
    rating: 4.7,
    review_count: 567,
    source_size: '5.1 MB',
    language: 'TypeScript',
    license: 'MIT',
    last_updated: '2026-03-15',
    comments: [
      { id: 6, user: 'devops_ninja', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ninja', text: 'Replaced 3 Zapier workflows with this. Incredibly flexible.', rating: 5, date: '2026-03-12' },
      { id: 7, user: 'cloud_rider', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=rider', text: 'DAG builder is clean. Retry logic saved us during a production outage.', rating: 5, date: '2026-02-28' },
      { id: 8, user: 'api_ghost', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ghost', text: 'Good agent but documentation could be more detailed.', rating: 4, date: '2026-01-15' },
    ],
  },
  {
    id: 4,
    name: 'DataPulse Analytics',
    description: 'Predictive analytics and anomaly detection agent for real-time business intelligence. Connects to SQL, NoSQL, and streaming sources. Features auto-generated dashboards, trend forecasting, and configurable alert thresholds.',
    category: 'Analytics',
    price: 99,
    rental_rate: 18,
    has_trial: false,
    download_count: 5614,
    creator_id: 1,
    created_at: '2025-11-01',
    avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=DataPulse&backgroundColor=00ff88',
    developer: 'Quantum Metrics',
    rating: 4.3,
    review_count: 98,
    source_size: '8.9 MB',
    language: 'Python / SQL',
    license: 'BSL 1.1',
    last_updated: '2026-03-08',
    comments: [
      { id: 9, user: 'analytics_ace', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=ace', text: 'Anomaly detection caught a billing issue we missed for months. Paid for itself day one.', rating: 5, date: '2026-03-05' },
      { id: 10, user: 'bi_baron', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=baron', text: 'Dashboards look great but custom SQL support needs work.', rating: 4, date: '2026-02-10' },
    ],
  },
  {
    id: 5,
    name: 'CipherGuard AI',
    description: 'Security threat detection and vulnerability assessment agent powered by behavioral analysis. Performs SAST/DAST scanning, dependency auditing, secrets detection, and generates compliance reports for SOC2 and ISO 27001.',
    category: 'Security',
    price: 129,
    rental_rate: 22,
    has_trial: true,
    download_count: 3892,
    creator_id: 4,
    created_at: '2025-10-15',
    avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=CipherGuard&backgroundColor=ff4444',
    developer: 'RedShield Security',
    rating: 4.9,
    review_count: 213,
    source_size: '12.3 MB',
    language: 'Go / Python',
    license: 'AGPL 3.0',
    last_updated: '2026-03-18',
    comments: [
      { id: 11, user: 'sec_phantom', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=phantom', text: 'Found 14 critical vulns in our codebase that Snyk missed. Absolute unit.', rating: 5, date: '2026-03-17' },
      { id: 12, user: 'pen_tester', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=tester', text: 'SOC2 report generation alone is worth the price. Clean and thorough.', rating: 5, date: '2026-03-01' },
      { id: 13, user: 'blue_team', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=blue', text: 'DAST scanning is solid. Would love to see container image scanning next.', rating: 4, date: '2026-02-20' },
    ],
  },
  {
    id: 6,
    name: 'LangBridge Translator',
    description: 'Multi-lingual neural translation agent with context-aware cultural adaptation for 100+ languages. Features glossary support, tone control, batch processing, and real-time streaming translation for chat applications.',
    category: 'NLP',
    price: 29,
    rental_rate: 5,
    has_trial: true,
    download_count: 34521,
    creator_id: 2,
    created_at: '2025-06-10',
    avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=LangBridge&backgroundColor=00ffff',
    developer: 'Polyglot Systems',
    rating: 4.6,
    review_count: 891,
    source_size: '3.7 MB',
    language: 'Python',
    license: 'MIT',
    last_updated: '2026-03-10',
    comments: [
      { id: 14, user: 'global_dev', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=global', text: 'Handles Japanese and Korean nuances better than Google Translate. Impressive.', rating: 5, date: '2026-03-08' },
      { id: 15, user: 'i18n_queen', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=queen', text: 'Glossary support is a game changer for our technical docs.', rating: 5, date: '2026-02-25' },
      { id: 16, user: 'startup_cto', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=cto', text: 'Great value at $29. Streaming mode works perfectly for our chat app.', rating: 4, date: '2026-01-30' },
    ],
  },
  {
    id: 7,
    name: 'SentinelWatch',
    description: 'Real-time network intrusion detection agent with ML-powered traffic analysis. Monitors ingress/egress patterns, flags suspicious payloads, and integrates with PagerDuty, OpsGenie, and custom webhook endpoints.',
    category: 'Security',
    price: 89,
    rental_rate: 16,
    has_trial: false,
    download_count: 2104,
    creator_id: 4,
    created_at: '2025-12-01',
    avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Sentinel&backgroundColor=ff4444',
    developer: 'RedShield Security',
    rating: 4.4,
    review_count: 76,
    source_size: '15.8 MB',
    language: 'Rust / Python',
    license: 'AGPL 3.0',
    last_updated: '2026-03-14',
    comments: [
      { id: 17, user: 'infra_monk', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=monk', text: 'Caught a data exfil attempt within hours of deployment. Rust core is blazing fast.', rating: 5, date: '2026-03-12' },
      { id: 18, user: 'noc_wizard', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=wizard', text: 'PagerDuty integration works flawlessly. Reduced our MTTR by 40%.', rating: 4, date: '2026-02-18' },
    ],
  },
  {
    id: 8,
    name: 'PixelForge Studio',
    description: 'AI-powered image generation and editing agent. Supports inpainting, outpainting, style transfer, upscaling, and batch processing. Runs locally with GPU acceleration or via cloud inference endpoints.',
    category: 'Vision',
    price: 59,
    rental_rate: 11,
    has_trial: true,
    download_count: 15230,
    creator_id: 2,
    created_at: '2025-08-25',
    avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=PixelForge&backgroundColor=7f00ff',
    developer: 'PixelMind Inc',
    rating: 4.7,
    review_count: 423,
    source_size: '45.2 MB',
    language: 'Python / CUDA',
    license: 'Apache 2.0',
    last_updated: '2026-03-16',
    comments: [
      { id: 19, user: 'art_hacker', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=hacker', text: 'Style transfer quality rivals Midjourney. Local GPU mode is a huge plus.', rating: 5, date: '2026-03-14' },
      { id: 20, user: 'design_punk', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=punk', text: 'Batch processing saved our team hours. Upscaling is chef kiss.', rating: 5, date: '2026-02-22' },
    ],
  },
  {
    id: 9,
    name: 'PipelinePilot',
    description: 'CI/CD automation agent that generates, optimizes, and monitors deployment pipelines. Supports GitHub Actions, GitLab CI, Jenkins, and ArgoCD. Auto-detects project type and suggests optimal pipeline configurations.',
    category: 'Automation',
    price: 45,
    rental_rate: 8,
    has_trial: true,
    download_count: 9876,
    creator_id: 3,
    created_at: '2025-09-15',
    avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Pipeline&backgroundColor=ff00ff',
    developer: 'FlowState Dev',
    rating: 4.6,
    review_count: 312,
    source_size: '4.2 MB',
    language: 'Go',
    license: 'MIT',
    last_updated: '2026-03-11',
    comments: [
      { id: 21, user: 'ci_samurai', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=samurai', text: 'Generated a perfect GH Actions pipeline for our monorepo in 30 seconds.', rating: 5, date: '2026-03-10' },
      { id: 22, user: 'deploy_diva', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=diva', text: 'ArgoCD integration is smooth. Auto-rollback detection is clutch.', rating: 4, date: '2026-02-15' },
    ],
  },
  {
    id: 10,
    name: 'InsightEngine',
    description: 'Natural language BI agent that turns plain English questions into SQL queries, charts, and executive summaries. Connects to PostgreSQL, MySQL, BigQuery, and Snowflake with automatic schema discovery.',
    category: 'Analytics',
    price: 119,
    rental_rate: 21,
    has_trial: true,
    download_count: 4320,
    creator_id: 1,
    created_at: '2025-12-15',
    avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Insight&backgroundColor=00ff88',
    developer: 'Quantum Metrics',
    rating: 4.8,
    review_count: 156,
    source_size: '6.5 MB',
    language: 'Python / TypeScript',
    license: 'BSL 1.1',
    last_updated: '2026-03-17',
    comments: [
      { id: 23, user: 'cfo_bot', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=cfo', text: 'Our CEO now queries the data warehouse directly. That says everything.', rating: 5, date: '2026-03-15' },
      { id: 24, user: 'sql_sage', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=sage', text: 'Schema discovery is magic. Generated correct JOINs across 12 tables.', rating: 5, date: '2026-03-02' },
      { id: 25, user: 'data_nomad', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=nomad', text: 'Snowflake integration has a few quirks but BigQuery support is flawless.', rating: 4, date: '2026-02-08' },
    ],
  },
]

export default function Marketplace({ searchQuery }: { searchQuery: string }) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAgents({
        category: category === 'All' ? undefined : category,
        search: searchQuery || undefined,
        page,
        limit: PAGE_SIZE,
      })
      setAgents(data.agents)
      setTotal(data.total)
    } catch {
      // Use mock data when API unavailable
      const filtered = MOCK_AGENTS.filter(a => {
        const matchCat = category === 'All' || a.category.toLowerCase() === category.toLowerCase()
        const matchSearch = !searchQuery || a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.description.toLowerCase().includes(searchQuery.toLowerCase())
        return matchCat && matchSearch
      })
      setTotal(filtered.length)
      setAgents(filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE))
    } finally {
      setLoading(false)
    }
  }, [category, searchQuery, page])

  useEffect(() => { void load() }, [load])

  // Reset to page 1 when category or search changes
  useEffect(() => { setPage(1) }, [category, searchQuery])

  return (
    <main className="cyber-grid-bg min-h-screen pt-16">
      {/* Scanline effect */}
      <div className="scanlines" />

      {/* Hero + filters wrapper — PeekingAgents is absolute inside here so heads scroll with page */}
      <div className="relative">

      {/* Hero section */}
      <section className="relative overflow-hidden">
        <div className="hero-glow absolute inset-0 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center relative">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <div className="h-px w-8 bg-neonCyan/50" />
            <span className="text-xs font-mono tracking-[0.3em] uppercase text-neonCyan/70">
              Next-Gen AI Marketplace
            </span>
            <div className="h-px w-8 bg-neonCyan/50" />
          </motion.div>

          {/* Headline */}
          <div className="relative mb-6">
            <motion.div
              animate={{ filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)'] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '80%',
                height: '220%',
                background: 'radial-gradient(ellipse at 50% 50%, rgba(0,255,255,0.4) 0%, transparent 65%)',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-black tracking-tight relative"
              style={{ fontFamily: "'Orbitron', sans-serif", zIndex: 1 }}
            >
              <span className="text-neonCyan text-2xl sm:text-4xl block mb-2" style={{ textShadow: '0 0 20px rgba(0,255,255,0.4)' }}>Find Your Next</span>
              <span className="text-white/80 text-5xl sm:text-7xl">AI Agent</span>
            </motion.h1>
          </div>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-white/40 font-mono max-w-xl mx-auto mb-10"
          >
            Browse, compare, and install AI agents built by developers worldwide. Buy, rent, or try for free.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex items-center justify-center gap-8 sm:gap-12"
          >
            {[
              { value: '500+', label: 'Agents' },
              { value: '12K+', label: 'Downloads' },
              { value: '99.9%', label: 'Uptime' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div
                  className="text-2xl font-black font-mono"
                  style={{ color: '#00ffff', textShadow: '0 0 10px rgba(0,255,255,0.5)' }}
                >
                  {stat.value}
                </div>
                <div className="text-[11px] text-white/30 tracking-widest uppercase font-mono">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Category filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`category-chip ${category === cat ? 'active' : ''}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      <PeekingAgents />
      </div>

      {/* Agent grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {/* Count + sort bar */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-mono text-white/30 tracking-wider">
            {loading ? (
              <span className="animate-pulse">LOADING...</span>
            ) : (
              `${total} AGENT${total !== 1 ? 'S' : ''} FOUND`
            )}
          </span>
          <div className="h-px flex-1 mx-4" style={{ background: 'linear-gradient(to right, transparent, rgba(0,255,255,0.1), transparent)' }} />
          <span className="text-xs font-mono text-neonCyan/30 tracking-wider">SORTED BY POPULARITY</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-52 rounded-lg animate-pulse"
                style={{ background: 'rgba(0,255,255,0.03)', border: '1px solid rgba(0,255,255,0.05)' }}
              />
            ))}
          </div>
        ) : agents.length > 0 ? (
          <AnimatePresence mode="popLayout">
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {agents.map((agent, i) => (
                <AgentCard key={agent.id} agent={agent} index={i} />
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="text-center py-20">
            <p className="text-white/20 font-mono text-sm tracking-wider">
              NO AGENTS FOUND
            </p>
            <p className="text-white/10 font-mono text-xs mt-2">
              Try adjusting your filters
            </p>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <MarketplacePagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </section>
    </main>
  )
}

function MarketplacePagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  const pages: (number | 'ellipsis')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== 'ellipsis') {
      pages.push('ellipsis')
    }
  }

  const handleClick = (p: number) => {
    onPageChange(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-10">
      <button
        onClick={() => handleClick(page - 1)}
        disabled={page <= 1}
        className="px-3 py-2 text-xs font-mono tracking-wider transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-default"
        style={{ color: 'rgba(0,255,255,0.6)' }}
      >
        &laquo; PREV
      </button>

      {pages.map((p, idx) =>
        p === 'ellipsis' ? (
          <span key={`e-${idx}`} className="px-2 text-xs font-mono text-white/20">...</span>
        ) : (
          <button
            key={p}
            onClick={() => handleClick(p)}
            className="w-9 h-9 rounded text-xs font-mono font-bold transition-all duration-150 cursor-pointer"
            style={
              p === page
                ? {
                    color: '#00ffff',
                    background: 'rgba(0,255,255,0.15)',
                    border: '1px solid rgba(0,255,255,0.4)',
                    boxShadow: '0 0 8px rgba(0,255,255,0.2)',
                  }
                : {
                    color: 'rgba(255,255,255,0.4)',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }
            }
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => handleClick(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-2 text-xs font-mono tracking-wider transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-default"
        style={{ color: 'rgba(0,255,255,0.6)' }}
      >
        NEXT &raquo;
      </button>
    </div>
  )
}
