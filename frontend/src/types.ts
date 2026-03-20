export interface Agent {
  id: number
  name: string
  description: string
  category: string
  price: number
  rental_rate: number
  rental_price?: number
  has_trial: boolean
  download_count: number
  creator_id: number
  created_at: string
  tags?: string[]
  avatar: string
  developer: string
  rating: number
  review_count: number
  source_size: string
  language: string
  license: string
  last_updated: string
  comments: Comment[]
}

export interface Comment {
  id: number
  user: string
  avatar: string
  text: string
  rating: number
  date: string
}

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  created_at: string
}

export interface Purchase {
  id: number
  user_id: number
  agent_id: number
  purchase_type: 'buy' | 'rent' | 'trial'
  amount: number
  expires_at?: string
  created_at: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface ApiError {
  error: string
}
