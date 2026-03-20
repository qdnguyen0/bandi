package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/bandiAI/internal/middleware"
	"github.com/bandiAI/internal/models"
	"github.com/bandiAI/internal/storage"
	"github.com/go-chi/chi/v5"
)

func seedCheckUser(t *testing.T, db *storage.DB, username string) {
	t.Helper()
	_, err := db.CreateUser(username, username+"@test.com", "hash", "F", "L", "user")
	if err != nil {
		t.Fatalf("CreateUser %q: %v", username, err)
	}
}

func seedCheckAgent(t *testing.T, db *storage.DB, devID int64, name string) {
	t.Helper()
	_, err := db.CreateAgent(&models.Agent{
		DevID: devID, Name: name, Version: "1.0.0", Price: 9.99, Category: "NLP",
	})
	if err != nil {
		t.Fatalf("CreateAgent %q: %v", name, err)
	}
}

type takenResp struct {
	Taken bool `json:"taken"`
}

// --- CheckUsername handler tests ---

func TestCheckUsername_Taken(t *testing.T) {
	db := newHandlerTestDB(t)
	seedCheckUser(t, db, "taken_user")
	h := NewAuthHandler(db, "secret")

	r := chi.NewRouter()
	r.Get("/api/auth/check-username", h.CheckUsername)

	req := httptest.NewRequest("GET", "/api/auth/check-username?username=taken_user", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var resp takenResp
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if !resp.Taken {
		t.Fatal("expected taken=true for existing username")
	}
}

func TestCheckUsername_Available(t *testing.T) {
	db := newHandlerTestDB(t)
	h := NewAuthHandler(db, "secret")

	r := chi.NewRouter()
	r.Get("/api/auth/check-username", h.CheckUsername)

	req := httptest.NewRequest("GET", "/api/auth/check-username?username=free_user", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var resp takenResp
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Taken {
		t.Fatal("expected taken=false for non-existing username")
	}
}

func TestCheckUsername_MissingParam(t *testing.T) {
	db := newHandlerTestDB(t)
	h := NewAuthHandler(db, "secret")

	r := chi.NewRouter()
	r.Get("/api/auth/check-username", h.CheckUsername)

	req := httptest.NewRequest("GET", "/api/auth/check-username", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

// --- CheckEmail handler tests ---

func TestCheckEmail_Taken(t *testing.T) {
	db := newHandlerTestDB(t)
	seedCheckUser(t, db, "email_check")
	h := NewAuthHandler(db, "secret")

	r := chi.NewRouter()
	r.Get("/api/auth/check-email", h.CheckEmail)

	req := httptest.NewRequest("GET", "/api/auth/check-email?email=email_check@test.com", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var resp takenResp
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if !resp.Taken {
		t.Fatal("expected taken=true for existing email")
	}
}

func TestCheckEmail_Available(t *testing.T) {
	db := newHandlerTestDB(t)
	h := NewAuthHandler(db, "secret")

	r := chi.NewRouter()
	r.Get("/api/auth/check-email", h.CheckEmail)

	req := httptest.NewRequest("GET", "/api/auth/check-email?email=nobody@nowhere.com", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var resp takenResp
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Taken {
		t.Fatal("expected taken=false for non-existing email")
	}
}

func TestCheckEmail_MissingParam(t *testing.T) {
	db := newHandlerTestDB(t)
	h := NewAuthHandler(db, "secret")

	r := chi.NewRouter()
	r.Get("/api/auth/check-email", h.CheckEmail)

	req := httptest.NewRequest("GET", "/api/auth/check-email", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

// --- CheckName (agent) handler tests ---

func TestCheckAgentName_Taken(t *testing.T) {
	db := newHandlerTestDB(t)
	dev, err := db.CreateUser("cn_dev", "cn_dev@test.com", "hash", "D", "U", "dev")
	if err != nil {
		t.Fatalf("CreateUser: %v", err)
	}
	seedCheckAgent(t, db, dev.ID, "TakenBot")
	h := NewAgentHandler(db, t.TempDir())

	r := chi.NewRouter()
	r.Get("/api/agents/check-name", h.CheckName)

	req := httptest.NewRequest("GET", "/api/agents/check-name?name=TakenBot", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var resp takenResp
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if !resp.Taken {
		t.Fatal("expected taken=true for existing agent name")
	}
}

func TestCheckAgentName_Available(t *testing.T) {
	db := newHandlerTestDB(t)
	h := NewAgentHandler(db, t.TempDir())

	r := chi.NewRouter()
	r.Get("/api/agents/check-name", h.CheckName)

	req := httptest.NewRequest("GET", "/api/agents/check-name?name=FreeBot", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var resp takenResp
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Taken {
		t.Fatal("expected taken=false for non-existing agent name")
	}
}

func TestCheckAgentName_MissingParam(t *testing.T) {
	db := newHandlerTestDB(t)
	h := NewAgentHandler(db, t.TempDir())

	r := chi.NewRouter()
	r.Get("/api/agents/check-name", h.CheckName)

	req := httptest.NewRequest("GET", "/api/agents/check-name", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

// --- ListByDev handler tests ---

// withDevContext injects user ID into request context for the ListByDev handler.
func withDevContext(r *http.Request, userID int64) *http.Request {
	ctx := context.WithValue(r.Context(), middleware.UserIDKey, userID)
	return r.WithContext(ctx)
}

func TestListByDev_ReturnsOwnAgents(t *testing.T) {
	db := newHandlerTestDB(t)
	dev1 := seedTestDev(t, db, "lbd_h_dev1")
	dev2 := seedTestDev(t, db, "lbd_h_dev2")

	seedCheckAgent(t, db, dev1, "Dev1Agent_A")
	seedCheckAgent(t, db, dev1, "Dev1Agent_B")
	seedCheckAgent(t, db, dev2, "Dev2Agent_A")

	h := NewAgentHandler(db, t.TempDir())
	r := chi.NewRouter()
	r.Get("/api/agents/my", h.ListByDev)

	req := httptest.NewRequest("GET", "/api/agents/my", nil)
	req = withDevContext(req, dev1)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp models.AgentListResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Total != 2 {
		t.Fatalf("expected total 2 for dev1, got %d", resp.Total)
	}
	if len(resp.Agents) != 2 {
		t.Fatalf("expected 2 agents, got %d", len(resp.Agents))
	}
	for _, a := range resp.Agents {
		if a.DevID != dev1 {
			t.Fatalf("expected dev_id %d, got %d", dev1, a.DevID)
		}
	}
}

func TestListByDev_EmptyForNewDev(t *testing.T) {
	db := newHandlerTestDB(t)
	devID := seedTestDev(t, db, "lbd_h_empty_dev")

	h := NewAgentHandler(db, t.TempDir())
	r := chi.NewRouter()
	r.Get("/api/agents/my", h.ListByDev)

	req := httptest.NewRequest("GET", "/api/agents/my", nil)
	req = withDevContext(req, devID)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp models.AgentListResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if resp.Total != 0 {
		t.Fatalf("expected total 0, got %d", resp.Total)
	}
	if len(resp.Agents) != 0 {
		t.Fatalf("expected 0 agents, got %d", len(resp.Agents))
	}
}

func TestListByDev_IncludesRatings(t *testing.T) {
	db := newHandlerTestDB(t)
	devID := seedTestDev(t, db, "lbd_h_rating_dev")
	seedCheckAgent(t, db, devID, "RatedAgent")

	// Seed reviews so ratings are populated
	if err := db.SeedReviews(); err != nil {
		t.Fatalf("SeedReviews: %v", err)
	}

	h := NewAgentHandler(db, t.TempDir())
	r := chi.NewRouter()
	r.Get("/api/agents/my", h.ListByDev)

	req := httptest.NewRequest("GET", "/api/agents/my", nil)
	req = withDevContext(req, devID)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var resp models.AgentListResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(resp.Agents) != 1 {
		t.Fatalf("expected 1 agent, got %d", len(resp.Agents))
	}
	if resp.Agents[0].ReviewCount == 0 {
		t.Fatal("expected non-zero review count after SeedReviews")
	}
	if resp.Agents[0].Rating <= 0 || resp.Agents[0].Rating > 5 {
		t.Fatalf("expected rating in (0,5], got %f", resp.Agents[0].Rating)
	}
}

func TestListByDev_DoesNotLeakOtherDevAgents(t *testing.T) {
	db := newHandlerTestDB(t)
	dev1 := seedTestDev(t, db, "lbd_h_leak_dev1")
	dev2 := seedTestDev(t, db, "lbd_h_leak_dev2")

	seedCheckAgent(t, db, dev1, "Secret_Agent_1")
	seedCheckAgent(t, db, dev1, "Secret_Agent_2")
	seedCheckAgent(t, db, dev2, "Public_Agent_1")

	h := NewAgentHandler(db, t.TempDir())
	r := chi.NewRouter()
	r.Get("/api/agents/my", h.ListByDev)

	// Request as dev2 — should only see their 1 agent
	req := httptest.NewRequest("GET", "/api/agents/my", nil)
	req = withDevContext(req, dev2)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	var resp models.AgentListResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(resp.Agents) != 1 {
		t.Fatalf("expected 1 agent for dev2, got %d", len(resp.Agents))
	}
	if resp.Agents[0].Name != "Public_Agent_1" {
		t.Fatalf("expected Public_Agent_1, got %q", resp.Agents[0].Name)
	}
}

func TestListByDev_RouteNotShadowedByIDParam(t *testing.T) {
	db := newHandlerTestDB(t)
	devID := seedTestDev(t, db, "lbd_h_route_dev")
	seedCheckAgent(t, db, devID, "RouteTestAgent")

	h := NewAgentHandler(db, t.TempDir())
	r := chi.NewRouter()
	// Register in same order as production: /my before /{id}
	r.Get("/api/agents/my", func(w http.ResponseWriter, req *http.Request) {
		req = withDevContext(req, devID)
		h.ListByDev(w, req)
	})
	r.Get("/api/agents/{id}", h.Get)

	req := httptest.NewRequest("GET", "/api/agents/my", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 from /my route, got %d (likely shadowed by /{id})", w.Code)
	}

	var resp models.AgentListResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if len(resp.Agents) != 1 {
		t.Fatalf("expected 1 agent, got %d", len(resp.Agents))
	}
}
