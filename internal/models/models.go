package models

import "time"

type User struct {
	ID           int64     `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	StripeID     string    `json:"stripe_id,omitempty"`
	Role         string    `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
}

type Agent struct {
	ID          int64     `json:"id"`
	DevID       int64     `json:"dev_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Version     string    `json:"version"`
	Price       float64   `json:"price"`
	RentalPrice *float64  `json:"rental_price,omitempty"`
	HasTrial    bool      `json:"has_trial"`
	FilePath    string    `json:"-"`
	FileHash    string    `json:"file_hash,omitempty"`
	Category    string    `json:"category"`
	Downloads   int       `json:"downloads"`
	CreatedAt   time.Time `json:"created_at"`
	Rating      float64   `json:"rating"`
	ReviewCount int       `json:"review_count"`
	Reviews     []Review  `json:"reviews,omitempty"`
}

type Review struct {
	ID        int64     `json:"id"`
	AgentID   int64     `json:"agent_id"`
	Username  string    `json:"user"`
	Avatar    string    `json:"avatar"`
	Text      string    `json:"text"`
	Rating    int       `json:"rating"`
	CreatedAt time.Time `json:"date"`
}

type Purchase struct {
	ID         int64      `json:"id"`
	UserID     int64      `json:"user_id"`
	AgentID    int64      `json:"agent_id"`
	Type       string     `json:"type"`
	ExpiryDate *time.Time `json:"expiry_date,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
}

// Request/response types

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type PurchaseRequest struct {
	AgentID int64  `json:"agent_id"`
	Type    string `json:"type"`
}

type AgentListResponse struct {
	Agents []Agent `json:"agents"`
	Total  int     `json:"total"`
	Page   int     `json:"page"`
	Limit  int     `json:"limit"`
}

type AgentSuggestion struct {
	ID       int64   `json:"id"`
	Name     string  `json:"name"`
	Category string  `json:"category"`
	Price    float64 `json:"price"`
}
