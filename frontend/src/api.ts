import type { Agent, AuthResponse, User } from './types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? 'Request failed')
  }
  return res.json() as Promise<T>
}

export async function fetchAgents(params?: {
  category?: string
  search?: string
  page?: number
  limit?: number
}): Promise<Agent[]> {
  const qs = new URLSearchParams()
  if (params?.category) qs.set('category', params.category)
  if (params?.search) qs.set('search', params.search)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.limit) qs.set('limit', String(params.limit))
  const query = qs.toString() ? `?${qs}` : ''
  const res = await request<{ agents: ApiAgent[] | null }>(`/agents${query}`)
  return (res.agents ?? []).map(mapAgent)
}

export async function fetchAgent(id: number): Promise<Agent> {
  const raw = await request<ApiAgent>(`/agents/${id}`)
  return mapAgent(raw)
}

// The Go API uses different field names than the frontend types
interface ApiAgent {
  id: number
  name: string
  description: string
  category: string
  price: number
  rental_price?: number
  has_trial: boolean
  downloads: number
  dev_id: number
  created_at: string
  rating?: number
  review_count?: number
  reviews?: { id: number; user: string; avatar: string; text: string; rating: number; date: string }[]
  [key: string]: unknown
}

const CATEGORY_AVATAR_COLORS: Record<string, string> = {
  nlp: '00ffff',
  vision: '7f00ff',
  automation: 'ff00ff',
  analytics: '00ff88',
  security: 'ff4444',
}

function agentAvatar(name: string, category: string): string {
  const bg = CATEGORY_AVATAR_COLORS[category.toLowerCase()] ?? '00ffff'
  const seed = encodeURIComponent(name.replace(/\s+/g, ''))
  return `https://api.dicebear.com/9.x/bottts/svg?seed=${seed}&backgroundColor=${bg}`
}

function mapAgent(a: ApiAgent): Agent {
  return {
    ...a,
    download_count: a.downloads ?? 0,
    rental_rate: a.rental_price ?? 0,
    creator_id: a.dev_id,
    avatar: agentAvatar(a.name, a.category ?? ''),
    developer: '',
    rating: a.rating ?? 0,
    review_count: a.review_count ?? 0,
    source_size: '',
    language: '',
    license: '',
    last_updated: a.created_at,
    comments: a.reviews ?? [],
  } as Agent
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  localStorage.setItem('token', data.token)
  return data
}

export async function register(username: string, email: string, password: string, firstName: string, lastName: string): Promise<AuthResponse> {
  const data = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, first_name: firstName, last_name: lastName }),
  })
  localStorage.setItem('token', data.token)
  return data
}

export async function fetchMe(): Promise<User> {
  return request<User>('/auth/me')
}

export interface ProfileResponse {
  user: User
  purchases: { id: number; user_id: number; agent_id: number; type: string; expiry_date?: string; created_at: string }[]
  favorite_ids: number[]
}

export async function fetchProfile(): Promise<ProfileResponse> {
  return request<ProfileResponse>('/auth/profile')
}

export async function purchaseAgent(
  agentId: number,
  purchaseType: 'buy' | 'rent' | 'trial',
): Promise<{ message: string }> {
  return request<{ message: string }>('/purchases', {
    method: 'POST',
    body: JSON.stringify({ agent_id: agentId, purchase_type: purchaseType }),
  })
}

export interface AgentSuggestion {
  id: number
  name: string
  category: string
  price: number
}

export async function suggestAgents(q: string, limit = 5): Promise<AgentSuggestion[]> {
  const qs = new URLSearchParams({ q, limit: String(limit) })
  return request<AgentSuggestion[]>(`/agents/suggest?${qs}`)
}

export async function fetchAgentSummary(agentId: number, description: string, rating: number, reviewCount: number): Promise<string> {
  // Fetch up to 30 reviews to give the model a good sentiment sample
  const reviewData = await fetchReviews(agentId, 1, 30)
  const body = {
    description,
    rating,
    review_count: reviewCount,
    comments: reviewData.reviews.map(c => ({
      user: c.user,
      text: c.text,
      rating: c.rating,
    })),
  }
  const res = await request<{ summary: string }>(`/agents/${agentId}/summary`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return res.summary
}

export interface ReviewsResponse {
  reviews: { id: number; user: string; avatar: string; text: string; rating: number; date: string }[]
  total: number
  page: number
  limit: number
}

export async function fetchReviews(agentId: number, page = 1, limit = 10): Promise<ReviewsResponse> {
  const qs = new URLSearchParams({ page: String(page), limit: String(limit) })
  return request<ReviewsResponse>(`/agents/${agentId}/reviews?${qs}`)
}
