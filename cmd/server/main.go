package main

import (
	"log"
	"net/http"
	"os"

	"github.com/bandiAI/internal/config"
	"github.com/bandiAI/internal/handlers"
	"github.com/bandiAI/internal/middleware"
	"github.com/bandiAI/internal/storage"
	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
)

func main() {
	cfg := config.Load()

	// Initialize database
	db, err := storage.New(cfg.DBPath)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}
	defer db.Close()

	if err := db.Migrate(); err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}

	if err := db.SeedReviews(); err != nil {
		log.Printf("warning: failed to seed reviews: %v", err)
	}

	// Initialize handlers
	authH := handlers.NewAuthHandler(db, cfg.JWTSecret)
	agentH := handlers.NewAgentHandler(db, cfg.VaultPath)
	purchaseH := handlers.NewPurchaseHandler(db)
	stripeH := handlers.NewStripeHandler(db, cfg.StripeWHSec)
	summaryH := handlers.NewSummaryHandler(cfg.GeminiKey)

	// Router
	r := chi.NewRouter()

	// Global middleware
	r.Use(middleware.CORS)
	r.Use(middleware.Logger)
	r.Use(chimw.Recoverer)
	r.Use(middleware.RateLimit(10, 20)) // 10 req/s, burst 20

	// Public routes
	r.Post("/api/auth/register", authH.Register)
	r.Post("/api/auth/login", authH.Login)
	r.Get("/api/agents", agentH.List)
	r.Get("/api/agents/suggest", agentH.Suggest)
	r.Get("/api/agents/{id}", agentH.Get)
	r.Get("/api/agents/{id}/reviews", agentH.Reviews)
	r.Post("/api/agents/{id}/summary", summaryH.Generate)
	r.Post("/api/webhooks/stripe", stripeH.HandleWebhook)

	// Protected routes
	r.Group(func(r chi.Router) {
		r.Use(middleware.Auth(cfg.JWTSecret))
		r.Get("/api/auth/me", authH.Me)
		r.Get("/api/auth/profile", authH.Profile)
		r.Post("/api/agents", agentH.Create)
		r.Get("/api/agents/{id}/download", agentH.Download)
		r.Post("/api/purchases", purchaseH.Create)
		r.Get("/api/purchases", purchaseH.List)
	})

	// Serve frontend static files
	if _, err := os.Stat("./frontend/dist"); err == nil {
		fs := http.FileServer(http.Dir("./frontend/dist"))
		r.Handle("/*", fs)
	}

	addr := ":" + cfg.Port
	log.Printf("BandiAI server starting on %s", addr)
	if err := http.ListenAndServe(addr, r); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
