package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/bandiAI/internal/middleware"
	"github.com/bandiAI/internal/storage"
)

type PurchaseHandler struct {
	db *storage.DB
}

func NewPurchaseHandler(db *storage.DB) *PurchaseHandler {
	return &PurchaseHandler{db: db}
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

func (h *PurchaseHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	purchases, err := h.db.GetUserPurchases(userID)
	if err != nil {
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}

	jsonResp(w, http.StatusOK, purchases)
}
