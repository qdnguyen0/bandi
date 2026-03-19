package config

import "os"

type Config struct {
	DBPath      string
	VaultPath   string
	JWTSecret   string
	StripeKey   string
	StripeWHSec string
	Port        string
}

func Load() Config {
	return Config{
		DBPath:      envOr("DB_PATH", "./data/bandiAI.db"),
		VaultPath:   envOr("VAULT_PATH", "./data/vault"),
		JWTSecret:   envOr("JWT_SECRET", "bandiAI-dev-secret-change-me"),
		StripeKey:   os.Getenv("STRIPE_KEY"),
		StripeWHSec: os.Getenv("STRIPE_WEBHOOK_SECRET"),
		Port:        envOr("PORT", "8080"),
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
