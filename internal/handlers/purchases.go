package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/bandiAI/internal/middleware"
	"github.com/bandiAI/internal/storage"
	"github.com/go-chi/chi/v5"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/checkout/session"
)

type PurchaseHandler struct {
	db        *storage.DB
	stripeKey string
}

func NewPurchaseHandler(db *storage.DB, stripeKey string) *PurchaseHandler {
	return &PurchaseHandler{db: db, stripeKey: stripeKey}
}

func (h *PurchaseHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req struct {
		AgentID int64  `json:"agent_id"`
		Type    string `json:"type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.Type != "buy" && req.Type != "rent" {
		jsonError(w, "type must be 'buy' or 'rent'", http.StatusBadRequest)
		return
	}

	// Verify agent exists
	agent, err := h.db.GetAgent(req.AgentID)
	if err != nil {
		jsonError(w, "agent not found", http.StatusNotFound)
		return
	}

	// Check for existing active purchase
	existing, err := h.db.GetActivePurchase(userID, req.AgentID)
	if err != nil {
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}
	if existing != nil {
		jsonError(w, "you already own or rent this agent", http.StatusConflict)
		return
	}

	var expiry *time.Time
	if req.Type == "rent" {
		if agent.RentalPrice == nil {
			jsonError(w, "agent not available for rent", http.StatusBadRequest)
			return
		}
		exp := time.Now().Add(30 * 24 * time.Hour) // 30-day rental
		expiry = &exp
	}

	purchase, err := h.db.CreatePurchase(userID, req.AgentID, req.Type, expiry)
	if err != nil {
		jsonError(w, "failed to create purchase", http.StatusInternalServerError)
		return
	}

	jsonResp(w, http.StatusCreated, purchase)
}

func (h *PurchaseHandler) Checkout(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var req struct {
		AgentID int64  `json:"agent_id"`
		Type    string `json:"type"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if req.Type != "buy" && req.Type != "rent" && req.Type != "trial" {
		jsonError(w, "type must be 'buy', 'rent', or 'trial'", http.StatusBadRequest)
		return
	}

	agent, err := h.db.GetAgent(req.AgentID)
	if err != nil {
		jsonError(w, "agent not found", http.StatusNotFound)
		return
	}

	// Check for existing active purchase
	existing, err := h.db.GetActivePurchase(userID, req.AgentID)
	if err != nil {
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}
	if existing != nil {
		jsonError(w, "you already own or rent this agent", http.StatusConflict)
		return
	}

	// Trial: create purchase directly
	if req.Type == "trial" {
		if !agent.HasTrial {
			jsonError(w, "agent does not offer a trial", http.StatusBadRequest)
			return
		}
		exp := time.Now().Add(7 * 24 * time.Hour)
		purchase, err := h.db.CreatePurchase(userID, req.AgentID, req.Type, &exp)
		if err != nil {
			jsonError(w, "failed to create purchase", http.StatusInternalServerError)
			return
		}
		jsonResp(w, http.StatusCreated, map[string]any{"purchase": purchase})
		return
	}

	// Determine price
	var priceInCents int64
	if req.Type == "rent" {
		if agent.RentalPrice == nil {
			jsonError(w, "agent not available for rent", http.StatusBadRequest)
			return
		}
		priceInCents = int64(*agent.RentalPrice * 100)
	} else {
		priceInCents = int64(agent.Price * 100)
	}

	// Stripe mode: create Checkout Session
	if h.stripeKey != "" {
		stripe.Key = h.stripeKey

		origin := r.Header.Get("Origin")
		if origin == "" {
			origin = fmt.Sprintf("https://%s", r.Host)
		}

		params := &stripe.CheckoutSessionParams{
			Mode: stripe.String(string(stripe.CheckoutSessionModePayment)),
			LineItems: []*stripe.CheckoutSessionLineItemParams{
				{
					PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
						Currency:   stripe.String("usd"),
						UnitAmount: stripe.Int64(priceInCents),
						ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
							Name: stripe.String(fmt.Sprintf("%s (%s)", agent.Name, req.Type)),
						},
					},
					Quantity: stripe.Int64(1),
				},
			},
			SuccessURL: stripe.String(fmt.Sprintf("%s/agents/%d?checkout=success", origin, agent.ID)),
			CancelURL:  stripe.String(fmt.Sprintf("%s/agents/%d?checkout=cancel", origin, agent.ID)),
		}
		params.AddMetadata("user_id", fmt.Sprintf("%d", userID))
		params.AddMetadata("agent_id", fmt.Sprintf("%d", agent.ID))
		params.AddMetadata("type", req.Type)

		s, err := session.New(params)
		if err != nil {
			jsonError(w, "failed to create checkout session", http.StatusInternalServerError)
			return
		}

		jsonResp(w, http.StatusOK, map[string]any{"url": s.URL})
		return
	}

	// Simulated mode: create purchase directly, let frontend show checkout modal
	var expiry *time.Time
	if req.Type == "rent" {
		exp := time.Now().Add(30 * 24 * time.Hour)
		expiry = &exp
	}

	purchase, err := h.db.CreatePurchase(userID, req.AgentID, req.Type, expiry)
	if err != nil {
		jsonError(w, "failed to create purchase", http.StatusInternalServerError)
		return
	}

	jsonResp(w, http.StatusCreated, map[string]any{"purchase": purchase})
}

func (h *PurchaseHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	purchases, err := h.db.GetUserPurchases(userID)
	if err != nil {
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}

	jsonResp(w, http.StatusOK, purchases)
}

func (h *PurchaseHandler) Status(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	agentIDStr := chi.URLParam(r, "agentID")
	var agentID int64
	if _, err := fmt.Sscanf(agentIDStr, "%d", &agentID); err != nil {
		jsonError(w, "invalid agent id", http.StatusBadRequest)
		return
	}

	purchase, err := h.db.GetActivePurchase(userID, agentID)
	if err != nil {
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}

	jsonResp(w, http.StatusOK, map[string]any{"purchase": purchase})
}
