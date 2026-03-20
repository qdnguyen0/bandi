package handlers

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"

	"github.com/bandiAI/internal/middleware"
	"github.com/bandiAI/internal/models"
	"github.com/bandiAI/internal/storage"
	"github.com/go-chi/chi/v5"
)

type AgentHandler struct {
	db        *storage.DB
	vaultPath string
}

func NewAgentHandler(db *storage.DB, vaultPath string) *AgentHandler {
	return &AgentHandler{db: db, vaultPath: vaultPath}
}

func (h *AgentHandler) List(w http.ResponseWriter, r *http.Request) {
	search := r.URL.Query().Get("search")
	category := r.URL.Query().Get("category")
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 20
	}

	agents, total, err := h.db.ListAgents(search, category, page, limit)
	if err != nil {
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}

	for i := range agents {
		rating, count, _ := h.db.GetAgentRating(agents[i].ID)
		agents[i].Rating = rating
		agents[i].ReviewCount = count
	}

	jsonResp(w, http.StatusOK, models.AgentListResponse{
		Agents: agents,
		Total:  total,
		Page:   page,
		Limit:  limit,
	})
}

func (h *AgentHandler) Suggest(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if q == "" {
		jsonResp(w, http.StatusOK, []models.AgentSuggestion{})
		return
	}

	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	suggestions, err := h.db.SuggestAgents(q, limit)
	if err != nil {
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}
	if suggestions == nil {
		suggestions = []models.AgentSuggestion{}
	}
	jsonResp(w, http.StatusOK, suggestions)
}

func (h *AgentHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		jsonError(w, "invalid id", http.StatusBadRequest)
		return
	}

	agent, err := h.db.GetAgent(id)
	if err != nil {
		jsonError(w, "agent not found", http.StatusNotFound)
		return
	}

	reviews, _, _ := h.db.GetReviewsByAgent(id, 1, 10)
	agent.Reviews = reviews
	rating, count, _ := h.db.GetAgentRating(id)
	agent.Rating = rating
	agent.ReviewCount = count

	jsonResp(w, http.StatusOK, agent)
}

func (h *AgentHandler) Reviews(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		jsonError(w, "invalid id", http.StatusBadRequest)
		return
	}

	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 10
	}

	reviews, total, err := h.db.GetReviewsByAgent(id, page, limit)
	if err != nil {
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}
	if reviews == nil {
		reviews = []models.Review{}
	}

	jsonResp(w, http.StatusOK, models.ReviewListResponse{
		Reviews: reviews,
		Total:   total,
		Page:    page,
		Limit:   limit,
	})
}

func (h *AgentHandler) CheckName(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	if name == "" {
		jsonError(w, "name required", http.StatusBadRequest)
		return
	}
	exists, err := h.db.AgentNameExists(name)
	if err != nil {
		jsonError(w, "internal error", http.StatusInternalServerError)
		return
	}
	jsonResp(w, http.StatusOK, map[string]bool{"taken": exists})
}

func (h *AgentHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	role := middleware.GetUserRole(r.Context())
	if role != "dev" {
		jsonError(w, "only developers can upload agents", http.StatusForbidden)
		return
	}

	if err := r.ParseMultipartForm(50 << 20); err != nil { // 50MB max
		jsonError(w, "invalid form data", http.StatusBadRequest)
		return
	}

	name := r.FormValue("name")
	description := r.FormValue("description")
	version := r.FormValue("version")
	category := r.FormValue("category")
	price, _ := strconv.ParseFloat(r.FormValue("price"), 64)
	rentalPrice, rpErr := strconv.ParseFloat(r.FormValue("rental_price"), 64)
	hasTrial := r.FormValue("has_trial") == "true"

	if name == "" || version == "" {
		jsonError(w, "name and version required", http.StatusBadRequest)
		return
	}

	agent := &models.Agent{
		DevID:       userID,
		Name:        name,
		Description: description,
		Version:     version,
		Price:       price,
		HasTrial:    hasTrial,
		Category:    category,
	}
	if rpErr == nil {
		agent.RentalPrice = &rentalPrice
	}

	// Handle file upload
	file, header, err := r.FormFile("file")
	if err == nil {
		defer file.Close()

		// Process file in background-safe manner: hash + save
		filePath, fileHash, saveErr := h.saveFile(file, header.Filename)
		if saveErr != nil {
			jsonError(w, "failed to save file", http.StatusInternalServerError)
			return
		}
		agent.FilePath = filePath
		agent.FileHash = fileHash
	}

	created, err := h.db.CreateAgent(agent)
	if err != nil {
		jsonError(w, "failed to create agent", http.StatusInternalServerError)
		return
	}

	jsonResp(w, http.StatusCreated, created)
}

func (h *AgentHandler) Download(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		jsonError(w, "invalid id", http.StatusBadRequest)
		return
	}

	agent, err := h.db.GetAgent(id)
	if err != nil {
		jsonError(w, "agent not found", http.StatusNotFound)
		return
	}

	if agent.FilePath == "" {
		jsonError(w, "no file available", http.StatusNotFound)
		return
	}

	fullPath := filepath.Join(h.vaultPath, agent.FilePath)
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filepath.Base(agent.FilePath)))
	w.Header().Set("Content-Type", "application/gzip")
	http.ServeFile(w, r, fullPath)

	_ = h.db.IncrementDownloads(id)
}

func (h *AgentHandler) saveFile(file io.Reader, filename string) (string, string, error) {
	if err := os.MkdirAll(h.vaultPath, 0o755); err != nil {
		return "", "", fmt.Errorf("create vault dir: %w", err)
	}

	hasher := sha256.New()
	tee := io.TeeReader(file, hasher)

	outName := filepath.Base(filename)
	if filepath.Ext(outName) != ".gz" {
		outName += ".tar.gz"
	}

	outPath := filepath.Join(h.vaultPath, outName)
	out, err := os.Create(outPath)
	if err != nil {
		return "", "", fmt.Errorf("create file: %w", err)
	}
	defer out.Close()

	if _, err := io.Copy(out, tee); err != nil {
		return "", "", fmt.Errorf("write file: %w", err)
	}

	hash := hex.EncodeToString(hasher.Sum(nil))
	return outName, hash, nil
}
