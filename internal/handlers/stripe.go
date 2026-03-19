package handlers

import (
	"encoding/json"
	"io"
	"log"
	"net/http"

	"github.com/bandiAI/internal/storage"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/webhook"
)

type StripeHandler struct {
	db        *storage.DB
	whSecret  string
}

func NewStripeHandler(db *storage.DB, webhookSecret string) *StripeHandler {
	return &StripeHandler{db: db, whSecret: webhookSecret}
}

func (h *StripeHandler) HandleWebhook(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(io.LimitReader(r.Body, 65536))
	if err != nil {
		jsonError(w, "read error", http.StatusBadRequest)
		return
	}

	event, err := webhook.ConstructEvent(body, r.Header.Get("Stripe-Signature"), h.whSecret)
	if err != nil {
		jsonError(w, "invalid signature", http.StatusBadRequest)
		return
	}

	switch event.Type {
	case "checkout.session.completed":
		var session stripe.CheckoutSession
		if err := json.Unmarshal(event.Data.Raw, &session); err != nil {
			log.Printf("stripe webhook: unmarshal session: %v", err)
			jsonError(w, "parse error", http.StatusBadRequest)
			return
		}
		log.Printf("stripe: checkout completed for customer %s", session.Customer.ID)
		// TODO: map session metadata to user/agent purchase
	default:
		log.Printf("stripe: unhandled event type %s", event.Type)
	}

	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(`{"received":true}`))
}
