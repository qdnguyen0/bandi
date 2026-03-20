package storage

import (
	"database/sql"
	"fmt"
	"testing"
	"time"

	"github.com/bandiAI/internal/models"
)

func newTestDB(t *testing.T) *DB {
	t.Helper()
	db, err := New(":memory:")
	if err != nil {
		t.Fatalf("New: %v", err)
	}
	if err := db.Migrate(); err != nil {
		t.Fatalf("Migrate: %v", err)
	}
	t.Cleanup(func() { db.Close() })
	return db
}

func seedUser(t *testing.T, db *DB, username string) int64 {
	t.Helper()
	u, err := db.CreateUser(username, username+"@test.com", "hash", "First", "Last", "user")
	if err != nil {
		t.Fatalf("CreateUser %q: %v", username, err)
	}
	return u.ID
}

func seedDev(t *testing.T, db *DB, username string) int64 {
	t.Helper()
	u, err := db.CreateUser(username, username+"@test.com", "hash", "Dev", "User", "dev")
	if err != nil {
		t.Fatalf("CreateUser dev %q: %v", username, err)
	}
	return u.ID
}

func seedAgent(t *testing.T, db *DB, devID int64, hasTrial bool, rentalPrice *float64) int64 {
	t.Helper()
	agentSeq++
	a := &models.Agent{
		DevID:       devID,
		Name:        fmt.Sprintf("TestAgent_%d", agentSeq),
		Description: "A test agent",
		Version:     "1.0.0",
		Price:       9.99,
		RentalPrice: rentalPrice,
		HasTrial:    hasTrial,
		Category:    "NLP",
	}
	created, err := db.CreateAgent(a)
	if err != nil {
		t.Fatalf("CreateAgent: %v", err)
	}
	return created.ID
}

var agentSeq int

// --- GetActivePurchase tests ---

func TestGetActivePurchase_NoneExists(t *testing.T) {
	db := newTestDB(t)
	userID := seedUser(t, db, "alice")
	devID := seedDev(t, db, "devuser")
	agentID := seedAgent(t, db, devID, false, nil)

	p, err := db.GetActivePurchase(userID, agentID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if p != nil {
		t.Fatalf("expected nil purchase, got %+v", p)
	}
}

func TestGetActivePurchase_BuyPurchase(t *testing.T) {
	db := newTestDB(t)
	userID := seedUser(t, db, "alice")
	devID := seedDev(t, db, "devuser")
	agentID := seedAgent(t, db, devID, false, nil)

	created, err := db.CreatePurchase(userID, agentID, "buy", nil)
	if err != nil {
		t.Fatalf("CreatePurchase: %v", err)
	}

	p, err := db.GetActivePurchase(userID, agentID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if p == nil {
		t.Fatal("expected purchase, got nil")
	}
	if p.ID != created.ID {
		t.Fatalf("expected ID %d, got %d", created.ID, p.ID)
	}
	if p.Type != "buy" {
		t.Fatalf("expected type 'buy', got %q", p.Type)
	}
}

func TestGetActivePurchase_ActiveRent(t *testing.T) {
	db := newTestDB(t)
	userID := seedUser(t, db, "bob")
	devID := seedDev(t, db, "devuser2")
	rentalPrice := 4.99
	agentID := seedAgent(t, db, devID, false, &rentalPrice)

	exp := time.Now().Add(30 * 24 * time.Hour)
	created, err := db.CreatePurchase(userID, agentID, "rent", &exp)
	if err != nil {
		t.Fatalf("CreatePurchase: %v", err)
	}

	p, err := db.GetActivePurchase(userID, agentID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if p == nil {
		t.Fatal("expected active rent purchase, got nil")
	}
	if p.ID != created.ID {
		t.Fatalf("expected ID %d, got %d", created.ID, p.ID)
	}
	if p.Type != "rent" {
		t.Fatalf("expected type 'rent', got %q", p.Type)
	}
}

func TestGetActivePurchase_ExpiredRent(t *testing.T) {
	db := newTestDB(t)
	userID := seedUser(t, db, "carol")
	devID := seedDev(t, db, "devuser3")
	rentalPrice := 4.99
	agentID := seedAgent(t, db, devID, false, &rentalPrice)

	exp := time.Now().Add(-1 * time.Hour) // already expired
	_, err := db.CreatePurchase(userID, agentID, "rent", &exp)
	if err != nil {
		t.Fatalf("CreatePurchase: %v", err)
	}

	p, err := db.GetActivePurchase(userID, agentID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if p != nil {
		t.Fatalf("expected nil for expired rent, got %+v", p)
	}
}

func TestGetActivePurchase_MostRecentWhenMultiple(t *testing.T) {
	db := newTestDB(t)
	userID := seedUser(t, db, "dave")
	devID := seedDev(t, db, "devuser4")
	rentalPrice := 4.99
	agentID := seedAgent(t, db, devID, false, &rentalPrice)

	// First purchase: expired rent
	expPast := time.Now().Add(-1 * time.Hour)
	_, err := db.CreatePurchase(userID, agentID, "rent", &expPast)
	if err != nil {
		t.Fatalf("CreatePurchase (expired): %v", err)
	}

	// Second purchase: active buy
	second, err := db.CreatePurchase(userID, agentID, "buy", nil)
	if err != nil {
		t.Fatalf("CreatePurchase (buy): %v", err)
	}

	p, err := db.GetActivePurchase(userID, agentID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if p == nil {
		t.Fatal("expected active purchase, got nil")
	}
	if p.ID != second.ID {
		t.Fatalf("expected most recent purchase ID %d, got %d", second.ID, p.ID)
	}
}

// --- CreatePurchase tests ---

func TestCreatePurchase_Buy(t *testing.T) {
	db := newTestDB(t)
	userID := seedUser(t, db, "eve")
	devID := seedDev(t, db, "devuser5")
	agentID := seedAgent(t, db, devID, false, nil)

	p, err := db.CreatePurchase(userID, agentID, "buy", nil)
	if err != nil {
		t.Fatalf("CreatePurchase: %v", err)
	}
	if p.ID == 0 {
		t.Fatal("expected non-zero ID")
	}
	if p.UserID != userID {
		t.Fatalf("expected userID %d, got %d", userID, p.UserID)
	}
	if p.AgentID != agentID {
		t.Fatalf("expected agentID %d, got %d", agentID, p.AgentID)
	}
	if p.Type != "buy" {
		t.Fatalf("expected type 'buy', got %q", p.Type)
	}
	if p.ExpiryDate != nil {
		t.Fatalf("expected nil expiry for buy, got %v", p.ExpiryDate)
	}
}

func TestCreatePurchase_Rent(t *testing.T) {
	db := newTestDB(t)
	userID := seedUser(t, db, "frank")
	devID := seedDev(t, db, "devuser6")
	rentalPrice := 4.99
	agentID := seedAgent(t, db, devID, false, &rentalPrice)

	exp := time.Now().Add(30 * 24 * time.Hour)
	p, err := db.CreatePurchase(userID, agentID, "rent", &exp)
	if err != nil {
		t.Fatalf("CreatePurchase: %v", err)
	}
	if p.Type != "rent" {
		t.Fatalf("expected type 'rent', got %q", p.Type)
	}
	if p.ExpiryDate == nil {
		t.Fatal("expected non-nil expiry for rent")
	}
	if p.ExpiryDate.Before(time.Now()) {
		t.Fatalf("expected expiry in the future, got %v", p.ExpiryDate)
	}
}

// --- GetUserByUsername tests ---

func TestGetUserByUsername_Found(t *testing.T) {
	db := newTestDB(t)
	seedUser(t, db, "gub_alice")

	u, err := db.GetUserByUsername("gub_alice")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if u.Username != "gub_alice" {
		t.Fatalf("expected username %q, got %q", "gub_alice", u.Username)
	}
	if u.Email != "gub_alice@test.com" {
		t.Fatalf("expected email %q, got %q", "gub_alice@test.com", u.Email)
	}
	if u.ID == 0 {
		t.Fatal("expected non-zero ID")
	}
}

func TestGetUserByUsername_NotFound(t *testing.T) {
	db := newTestDB(t)

	_, err := db.GetUserByUsername("doesnotexist")
	if err != sql.ErrNoRows {
		t.Fatalf("expected sql.ErrNoRows, got %v", err)
	}
}

// --- GetUserByEmail tests ---

func TestGetUserByEmail_Found(t *testing.T) {
	db := newTestDB(t)
	seedUser(t, db, "gube_bob")

	u, err := db.GetUserByEmail("gube_bob@test.com")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if u.Email != "gube_bob@test.com" {
		t.Fatalf("expected email %q, got %q", "gube_bob@test.com", u.Email)
	}
}

func TestGetUserByEmail_NotFound(t *testing.T) {
	db := newTestDB(t)

	_, err := db.GetUserByEmail("nobody@test.com")
	if err != sql.ErrNoRows {
		t.Fatalf("expected sql.ErrNoRows, got %v", err)
	}
}

// --- GetUserByID tests ---

func TestGetUserByID_Found(t *testing.T) {
	db := newTestDB(t)
	id := seedUser(t, db, "gubid_carol")

	u, err := db.GetUserByID(id)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if u.ID != id {
		t.Fatalf("expected ID %d, got %d", id, u.ID)
	}
	if u.Username != "gubid_carol" {
		t.Fatalf("expected username %q, got %q", "gubid_carol", u.Username)
	}
}

func TestGetUserByID_NotFound(t *testing.T) {
	db := newTestDB(t)

	_, err := db.GetUserByID(99999)
	if err != sql.ErrNoRows {
		t.Fatalf("expected sql.ErrNoRows, got %v", err)
	}
}

// --- GetAgent tests ---

func TestGetAgent_Found(t *testing.T) {
	db := newTestDB(t)
	devID := seedDev(t, db, "ga_dev")
	price := 2.99
	agentID := seedAgent(t, db, devID, true, &price)

	a, err := db.GetAgent(agentID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if a.ID != agentID {
		t.Fatalf("expected ID %d, got %d", agentID, a.ID)
	}
	if a.RentalPrice == nil {
		t.Fatal("expected non-nil RentalPrice")
	}
	if *a.RentalPrice != price {
		t.Fatalf("expected RentalPrice %f, got %f", price, *a.RentalPrice)
	}
	if !a.HasTrial {
		t.Fatal("expected HasTrial true")
	}
}

func TestGetAgent_NoRentalPrice(t *testing.T) {
	db := newTestDB(t)
	devID := seedDev(t, db, "ga_dev2")
	agentID := seedAgent(t, db, devID, false, nil)

	a, err := db.GetAgent(agentID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if a.RentalPrice != nil {
		t.Fatalf("expected nil RentalPrice, got %v", a.RentalPrice)
	}
}

func TestGetAgent_NotFound(t *testing.T) {
	db := newTestDB(t)

	_, err := db.GetAgent(99999)
	if err != sql.ErrNoRows {
		t.Fatalf("expected sql.ErrNoRows, got %v", err)
	}
}

// --- ListAgents tests ---

func TestListAgents_AllAgents(t *testing.T) {
	db := newTestDB(t)
	devID := seedDev(t, db, "la_dev")
	seedAgent(t, db, devID, false, nil)
	seedAgent(t, db, devID, false, nil)

	agents, total, err := db.ListAgents("", "", 1, 10)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if total != 2 {
		t.Fatalf("expected total 2, got %d", total)
	}
	if len(agents) != 2 {
		t.Fatalf("expected 2 agents, got %d", len(agents))
	}
}

func TestListAgents_CategoryFilter(t *testing.T) {
	db := newTestDB(t)
	devID := seedDev(t, db, "la_dev2")
	// seedAgent always creates category "NLP"
	seedAgent(t, db, devID, false, nil)

	agents, total, err := db.ListAgents("", "NLP", 1, 10)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if total != 1 {
		t.Fatalf("expected total 1, got %d", total)
	}
	if len(agents) != 1 {
		t.Fatalf("expected 1 agent, got %d", len(agents))
	}

	agents, total, err = db.ListAgents("", "Vision", 1, 10)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if total != 0 {
		t.Fatalf("expected total 0 for Vision, got %d", total)
	}
	if len(agents) != 0 {
		t.Fatalf("expected 0 agents for Vision, got %d", len(agents))
	}
}

func TestListAgents_SearchFTS(t *testing.T) {
	db := newTestDB(t)
	devID := seedDev(t, db, "la_dev3")
	seedAgent(t, db, devID, false, nil)

	// "TestAgent" is the name used by seedAgent
	agents, total, err := db.ListAgents("TestAg", "", 1, 10)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if total != 1 {
		t.Fatalf("expected total 1, got %d", total)
	}
	if len(agents) != 1 {
		t.Fatalf("expected 1 agent from FTS search, got %d", len(agents))
	}
}

func TestListAgents_Pagination(t *testing.T) {
	db := newTestDB(t)
	devID := seedDev(t, db, "la_dev4")
	for i := 0; i < 5; i++ {
		seedAgent(t, db, devID, false, nil)
	}

	agents, total, err := db.ListAgents("", "", 1, 2)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if total != 5 {
		t.Fatalf("expected total 5, got %d", total)
	}
	if len(agents) != 2 {
		t.Fatalf("expected 2 agents on page 1, got %d", len(agents))
	}

	agents2, _, err := db.ListAgents("", "", 2, 2)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(agents2) != 2 {
		t.Fatalf("expected 2 agents on page 2, got %d", len(agents2))
	}
}

// --- SuggestAgents tests ---

func TestSuggestAgents_Matches(t *testing.T) {
	db := newTestDB(t)
	devID := seedDev(t, db, "sa_dev")
	seedAgent(t, db, devID, false, nil)

	suggestions, err := db.SuggestAgents("Test", 5)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(suggestions) != 1 {
		t.Fatalf("expected 1 suggestion, got %d", len(suggestions))
	}
}

func TestSuggestAgents_LimitDefaulting(t *testing.T) {
	db := newTestDB(t)
	devID := seedDev(t, db, "sa_dev2")
	for i := 0; i < 8; i++ {
		seedAgent(t, db, devID, false, nil)
	}

	// limit=0 should default to 5
	suggestions, err := db.SuggestAgents("Test", 0)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(suggestions) > 5 {
		t.Fatalf("expected at most 5 suggestions with limit=0 (defaults to 5), got %d", len(suggestions))
	}
}

func TestSuggestAgents_NoMatch(t *testing.T) {
	db := newTestDB(t)

	suggestions, err := db.SuggestAgents("zzznomatch", 5)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(suggestions) != 0 {
		t.Fatalf("expected 0 suggestions, got %d", len(suggestions))
	}
}

// --- IncrementDownloads tests ---

func TestIncrementDownloads(t *testing.T) {
	db := newTestDB(t)
	devID := seedDev(t, db, "id_dev")
	agentID := seedAgent(t, db, devID, false, nil)

	if err := db.IncrementDownloads(agentID); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if err := db.IncrementDownloads(agentID); err != nil {
		t.Fatalf("unexpected error on second increment: %v", err)
	}

	a, err := db.GetAgent(agentID)
	if err != nil {
		t.Fatalf("GetAgent: %v", err)
	}
	if a.Downloads != 2 {
		t.Fatalf("expected downloads=2, got %d", a.Downloads)
	}
}

// --- GetUserPurchases tests ---

func TestGetUserPurchases_Empty(t *testing.T) {
	db := newTestDB(t)
	userID := seedUser(t, db, "gup_alice")

	purchases, err := db.GetUserPurchases(userID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(purchases) != 0 {
		t.Fatalf("expected 0 purchases, got %d", len(purchases))
	}
}

func TestGetUserPurchases_Multiple(t *testing.T) {
	db := newTestDB(t)
	userID := seedUser(t, db, "gup_bob")
	devID := seedDev(t, db, "gup_dev")
	agentID1 := seedAgent(t, db, devID, false, nil)
	price := 3.99
	agentID2 := seedAgent(t, db, devID, false, &price)

	_, err := db.CreatePurchase(userID, agentID1, "buy", nil)
	if err != nil {
		t.Fatalf("CreatePurchase 1: %v", err)
	}
	exp := time.Now().Add(7 * 24 * time.Hour)
	_, err = db.CreatePurchase(userID, agentID2, "rent", &exp)
	if err != nil {
		t.Fatalf("CreatePurchase 2: %v", err)
	}

	purchases, err := db.GetUserPurchases(userID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(purchases) != 2 {
		t.Fatalf("expected 2 purchases, got %d", len(purchases))
	}
}

// --- GetUserFavorites tests ---

func TestGetUserFavorites_Empty(t *testing.T) {
	db := newTestDB(t)
	userID := seedUser(t, db, "guf_alice")

	ids, err := db.GetUserFavorites(userID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(ids) != 0 {
		t.Fatalf("expected 0 favorites, got %d", len(ids))
	}
}

func TestGetUserFavorites_WithFavorites(t *testing.T) {
	db := newTestDB(t)
	userID := seedUser(t, db, "guf_bob")
	devID := seedDev(t, db, "guf_dev")
	agentID := seedAgent(t, db, devID, false, nil)

	_, err := db.conn.Exec("INSERT INTO user_favorites (user_id, agent_id) VALUES (?, ?)", userID, agentID)
	if err != nil {
		t.Fatalf("insert favorite: %v", err)
	}

	ids, err := db.GetUserFavorites(userID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(ids) != 1 {
		t.Fatalf("expected 1 favorite, got %d", len(ids))
	}
	if ids[0] != agentID {
		t.Fatalf("expected agentID %d, got %d", agentID, ids[0])
	}
}

// --- UpdateUserStripeID tests ---

func TestUpdateUserStripeID(t *testing.T) {
	db := newTestDB(t)
	userID := seedUser(t, db, "uusi_alice")

	if err := db.UpdateUserStripeID(userID, "cus_test123"); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	u, err := db.GetUserByID(userID)
	if err != nil {
		t.Fatalf("GetUserByID: %v", err)
	}
	if u.StripeID != "cus_test123" {
		t.Fatalf("expected StripeID %q, got %q", "cus_test123", u.StripeID)
	}
}

// --- GetReviewsByAgent tests ---

func TestGetReviewsByAgent_Empty(t *testing.T) {
	db := newTestDB(t)
	devID := seedDev(t, db, "grba_dev")
	agentID := seedAgent(t, db, devID, false, nil)

	reviews, total, err := db.GetReviewsByAgent(agentID, 1, 10)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if total != 0 {
		t.Fatalf("expected total 0, got %d", total)
	}
	if len(reviews) != 0 {
		t.Fatalf("expected 0 reviews, got %d", len(reviews))
	}
}

func TestGetReviewsByAgent_WithReviews(t *testing.T) {
	db := newTestDB(t)
	devID := seedDev(t, db, "grba_dev2")
	agentID := seedAgent(t, db, devID, false, nil)

	if err := db.SeedReviews(); err != nil {
		t.Fatalf("SeedReviews: %v", err)
	}

	reviews, total, err := db.GetReviewsByAgent(agentID, 1, 5)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if total == 0 {
		t.Fatal("expected non-zero total after SeedReviews")
	}
	if len(reviews) == 0 {
		t.Fatal("expected at least one review")
	}
}

func TestGetReviewsByAgent_Pagination(t *testing.T) {
	db := newTestDB(t)
	devID := seedDev(t, db, "grba_dev3")
	agentID := seedAgent(t, db, devID, false, nil)

	if err := db.SeedReviews(); err != nil {
		t.Fatalf("SeedReviews: %v", err)
	}

	_, total, err := db.GetReviewsByAgent(agentID, 1, 3)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	reviews2, total2, err := db.GetReviewsByAgent(agentID, 2, 3)
	if err != nil {
		t.Fatalf("unexpected error on page 2: %v", err)
	}
	if total2 != total {
		t.Fatalf("total should be the same across pages: %d vs %d", total, total2)
	}
	_ = reviews2
}

// --- GetAgentRating tests ---

func TestGetAgentRating_NoReviews(t *testing.T) {
	db := newTestDB(t)
	devID := seedDev(t, db, "gar_dev")
	agentID := seedAgent(t, db, devID, false, nil)

	avg, count, err := db.GetAgentRating(agentID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if avg != 0 {
		t.Fatalf("expected avg=0 with no reviews, got %f", avg)
	}
	if count != 0 {
		t.Fatalf("expected count=0 with no reviews, got %d", count)
	}
}

func TestGetAgentRating_WithReviews(t *testing.T) {
	db := newTestDB(t)
	devID := seedDev(t, db, "gar_dev2")
	agentID := seedAgent(t, db, devID, false, nil)

	if err := db.SeedReviews(); err != nil {
		t.Fatalf("SeedReviews: %v", err)
	}

	avg, count, err := db.GetAgentRating(agentID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if count == 0 {
		t.Fatal("expected non-zero count after SeedReviews")
	}
	if avg <= 0 || avg > 5 {
		t.Fatalf("expected avg in (0,5], got %f", avg)
	}
}

// --- SeedReviews tests ---

func TestSeedReviews_PopulatesReviews(t *testing.T) {
	db := newTestDB(t)
	devID := seedDev(t, db, "sr_dev")
	seedAgent(t, db, devID, false, nil)

	if err := db.SeedReviews(); err != nil {
		t.Fatalf("first SeedReviews: %v", err)
	}

	var count int
	if err := db.conn.QueryRow("SELECT COUNT(*) FROM reviews").Scan(&count); err != nil {
		t.Fatalf("count reviews: %v", err)
	}
	if count == 0 {
		t.Fatal("expected reviews to be seeded")
	}
}

func TestSeedReviews_IdempotentWhenReviewsExist(t *testing.T) {
	db := newTestDB(t)
	devID := seedDev(t, db, "sr_dev2")
	seedAgent(t, db, devID, false, nil)

	if err := db.SeedReviews(); err != nil {
		t.Fatalf("first SeedReviews: %v", err)
	}

	var countAfterFirst int
	if err := db.conn.QueryRow("SELECT COUNT(*) FROM reviews").Scan(&countAfterFirst); err != nil {
		t.Fatalf("count: %v", err)
	}

	// Second call should be a no-op (reviews already exist)
	if err := db.SeedReviews(); err != nil {
		t.Fatalf("second SeedReviews: %v", err)
	}

	var countAfterSecond int
	if err := db.conn.QueryRow("SELECT COUNT(*) FROM reviews").Scan(&countAfterSecond); err != nil {
		t.Fatalf("count: %v", err)
	}
	if countAfterFirst != countAfterSecond {
		t.Fatalf("expected same count after second seed: first=%d, second=%d", countAfterFirst, countAfterSecond)
	}
}

// --- Uniqueness constraint tests ---

func TestCreateUser_DuplicateUsername(t *testing.T) {
	db := newTestDB(t)
	seedUser(t, db, "unique_alice")

	_, err := db.CreateUser("unique_alice", "different@test.com", "hash", "F", "L", "user")
	if err == nil {
		t.Fatal("expected error when creating user with duplicate username")
	}
}

func TestCreateUser_DuplicateEmail(t *testing.T) {
	db := newTestDB(t)
	seedUser(t, db, "dup_email_user")

	_, err := db.CreateUser("other_user", "dup_email_user@test.com", "hash", "F", "L", "user")
	if err == nil {
		t.Fatal("expected error when creating user with duplicate email")
	}
}

func TestCreateUser_SameUsernameAfterDifferent(t *testing.T) {
	db := newTestDB(t)
	seedUser(t, db, "first_user")
	seedUser(t, db, "second_user")

	_, err := db.CreateUser("first_user", "new@test.com", "hash", "F", "L", "user")
	if err == nil {
		t.Fatal("expected error for duplicate username even with other users in between")
	}
}

func TestCreateAgent_DuplicateName(t *testing.T) {
	db := newTestDB(t)
	devID := seedDev(t, db, "dup_agent_dev")

	_, err := db.CreateAgent(&models.Agent{
		DevID: devID, Name: "UniqueBot", Version: "1.0.0", Price: 9.99, Category: "NLP",
	})
	if err != nil {
		t.Fatalf("first create should succeed: %v", err)
	}

	_, err = db.CreateAgent(&models.Agent{
		DevID: devID, Name: "UniqueBot", Version: "2.0.0", Price: 19.99, Category: "Vision",
	})
	if err == nil {
		t.Fatal("expected error when creating agent with duplicate name")
	}
}

func TestCreateAgent_DuplicateNameDifferentDev(t *testing.T) {
	db := newTestDB(t)
	dev1 := seedDev(t, db, "dup_name_dev1")
	dev2 := seedDev(t, db, "dup_name_dev2")

	_, err := db.CreateAgent(&models.Agent{
		DevID: dev1, Name: "SharedName", Version: "1.0.0", Price: 9.99, Category: "NLP",
	})
	if err != nil {
		t.Fatalf("first create should succeed: %v", err)
	}

	_, err = db.CreateAgent(&models.Agent{
		DevID: dev2, Name: "SharedName", Version: "1.0.0", Price: 9.99, Category: "NLP",
	})
	if err == nil {
		t.Fatal("expected error when different dev creates agent with same name")
	}
}

func TestCreateAgent_DifferentNamesSucceed(t *testing.T) {
	db := newTestDB(t)
	devID := seedDev(t, db, "diff_name_dev")

	_, err := db.CreateAgent(&models.Agent{
		DevID: devID, Name: "AgentAlpha", Version: "1.0.0", Price: 9.99, Category: "NLP",
	})
	if err != nil {
		t.Fatalf("first create should succeed: %v", err)
	}

	_, err = db.CreateAgent(&models.Agent{
		DevID: devID, Name: "AgentBeta", Version: "1.0.0", Price: 9.99, Category: "NLP",
	})
	if err != nil {
		t.Fatalf("second create with different name should succeed: %v", err)
	}
}

// --- UsernameExists tests ---

func TestUsernameExists_True(t *testing.T) {
	db := newTestDB(t)
	seedUser(t, db, "exists_user")

	exists, err := db.UsernameExists("exists_user")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !exists {
		t.Fatal("expected username to exist")
	}
}

func TestUsernameExists_False(t *testing.T) {
	db := newTestDB(t)

	exists, err := db.UsernameExists("no_such_user")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if exists {
		t.Fatal("expected username to not exist")
	}
}

// --- EmailExists tests ---

func TestEmailExists_True(t *testing.T) {
	db := newTestDB(t)
	seedUser(t, db, "email_exists")

	exists, err := db.EmailExists("email_exists@test.com")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !exists {
		t.Fatal("expected email to exist")
	}
}

func TestEmailExists_False(t *testing.T) {
	db := newTestDB(t)

	exists, err := db.EmailExists("nobody@nowhere.com")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if exists {
		t.Fatal("expected email to not exist")
	}
}

// --- AgentNameExists tests ---

func TestAgentNameExists_True(t *testing.T) {
	db := newTestDB(t)
	devID := seedDev(t, db, "ane_dev")

	_, err := db.CreateAgent(&models.Agent{
		DevID: devID, Name: "ExistsBot", Version: "1.0.0", Price: 9.99, Category: "NLP",
	})
	if err != nil {
		t.Fatalf("CreateAgent: %v", err)
	}

	exists, err := db.AgentNameExists("ExistsBot")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !exists {
		t.Fatal("expected agent name to exist")
	}
}

func TestAgentNameExists_False(t *testing.T) {
	db := newTestDB(t)

	exists, err := db.AgentNameExists("NoSuchAgent")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if exists {
		t.Fatal("expected agent name to not exist")
	}
}

