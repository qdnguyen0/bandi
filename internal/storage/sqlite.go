package storage

import (
	"database/sql"
	_ "embed"
	"fmt"
	"time"

	"github.com/bandiAI/internal/models"
	_ "modernc.org/sqlite"
)

//go:embed schema.sql
var schemaSQL string

type DB struct {
	conn *sql.DB
}

func New(dbPath string) (*DB, error) {
	conn, err := sql.Open("sqlite", dbPath+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}
	conn.SetMaxOpenConns(1)
	conn.SetMaxIdleConns(1)
	conn.SetConnMaxLifetime(0)
	return &DB{conn: conn}, nil
}

func (db *DB) Migrate() error {
	_, err := db.conn.Exec(schemaSQL)
	if err != nil {
		return fmt.Errorf("migrate: %w", err)
	}
	return nil
}

func (db *DB) Close() error {
	return db.conn.Close()
}

// --- Users ---

func (db *DB) CreateUser(username, email, password, firstName, lastName, role string) (*models.User, error) {
	res, err := db.conn.Exec(
		"INSERT INTO users (username, email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)",
		username, email, password, firstName, lastName, role,
	)
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	id, _ := res.LastInsertId()
	return &models.User{
		ID:        id,
		Username:  username,
		Email:     email,
		FirstName: firstName,
		LastName:  lastName,
		Role:      role,
	}, nil
}

func (db *DB) GetUserByUsername(username string) (*models.User, error) {
	u := &models.User{}
	err := db.conn.QueryRow(
		"SELECT id, username, email, password, first_name, last_name, COALESCE(stripe_id,''), role, created_at FROM users WHERE username = ?",
		username,
	).Scan(&u.ID, &u.Username, &u.Email, &u.Password, &u.FirstName, &u.LastName, &u.StripeID, &u.Role, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (db *DB) GetUserByEmail(email string) (*models.User, error) {
	u := &models.User{}
	err := db.conn.QueryRow(
		"SELECT id, username, email, password, first_name, last_name, COALESCE(stripe_id,''), role, created_at FROM users WHERE email = ?",
		email,
	).Scan(&u.ID, &u.Username, &u.Email, &u.Password, &u.FirstName, &u.LastName, &u.StripeID, &u.Role, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (db *DB) GetUserByID(id int64) (*models.User, error) {
	u := &models.User{}
	err := db.conn.QueryRow(
		"SELECT id, username, email, password, first_name, last_name, COALESCE(stripe_id,''), role, created_at FROM users WHERE id = ?",
		id,
	).Scan(&u.ID, &u.Username, &u.Email, &u.Password, &u.FirstName, &u.LastName, &u.StripeID, &u.Role, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return u, nil
}

// --- Agents ---

func (db *DB) CreateAgent(a *models.Agent) (*models.Agent, error) {
	res, err := db.conn.Exec(
		`INSERT INTO agents (dev_id, name, description, version, price, rental_price, has_trial, file_path, file_hash, category)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		a.DevID, a.Name, a.Description, a.Version, a.Price, a.RentalPrice, a.HasTrial, a.FilePath, a.FileHash, a.Category,
	)
	if err != nil {
		return nil, fmt.Errorf("create agent: %w", err)
	}
	a.ID, _ = res.LastInsertId()
	a.CreatedAt = time.Now()
	return a, nil
}

func (db *DB) GetAgent(id int64) (*models.Agent, error) {
	a := &models.Agent{}
	var rentalPrice sql.NullFloat64
	err := db.conn.QueryRow(
		`SELECT id, dev_id, name, COALESCE(description,''), version, price, rental_price, has_trial,
		        COALESCE(file_path,''), COALESCE(file_hash,''), COALESCE(category,''), downloads, created_at
		 FROM agents WHERE id = ?`, id,
	).Scan(&a.ID, &a.DevID, &a.Name, &a.Description, &a.Version, &a.Price, &rentalPrice,
		&a.HasTrial, &a.FilePath, &a.FileHash, &a.Category, &a.Downloads, &a.CreatedAt)
	if err != nil {
		return nil, err
	}
	if rentalPrice.Valid {
		a.RentalPrice = &rentalPrice.Float64
	}
	return a, nil
}

func (db *DB) ListAgents(search, category string, page, limit int) ([]models.Agent, int, error) {
	where := "1=1"
	args := []any{}

	if search != "" {
		// Use FTS5 for full-text search
		where += " AND id IN (SELECT rowid FROM agents_fts WHERE agents_fts MATCH ?)"
		// Append * for prefix matching (e.g. "neur" matches "neural")
		args = append(args, search+"*")
	}
	if category != "" {
		where += " AND category = ?"
		args = append(args, category)
	}

	var total int
	err := db.conn.QueryRow("SELECT COUNT(*) FROM agents WHERE "+where, args...).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count agents: %w", err)
	}

	offset := (page - 1) * limit
	args = append(args, limit, offset)
	rows, err := db.conn.Query(
		"SELECT id, dev_id, name, COALESCE(description,''), version, price, rental_price, has_trial, COALESCE(category,''), downloads, created_at FROM agents WHERE "+where+" ORDER BY created_at DESC LIMIT ? OFFSET ?",
		args...,
	)
	if err != nil {
		return nil, 0, fmt.Errorf("list agents: %w", err)
	}
	defer rows.Close()

	var agents []models.Agent
	for rows.Next() {
		var a models.Agent
		var rentalPrice sql.NullFloat64
		if err := rows.Scan(&a.ID, &a.DevID, &a.Name, &a.Description, &a.Version, &a.Price, &rentalPrice, &a.HasTrial, &a.Category, &a.Downloads, &a.CreatedAt); err != nil {
			return nil, 0, fmt.Errorf("scan agent: %w", err)
		}
		if rentalPrice.Valid {
			a.RentalPrice = &rentalPrice.Float64
		}
		agents = append(agents, a)
	}
	return agents, total, nil
}

// SuggestAgents returns lightweight suggestions for typeahead search using FTS5.
func (db *DB) SuggestAgents(query string, limit int) ([]models.AgentSuggestion, error) {
	if limit < 1 || limit > 10 {
		limit = 5
	}
	rows, err := db.conn.Query(
		`SELECT a.id, a.name, a.category, a.price
		 FROM agents a
		 JOIN agents_fts f ON a.id = f.rowid
		 WHERE agents_fts MATCH ?
		 ORDER BY rank
		 LIMIT ?`,
		query+"*", limit,
	)
	if err != nil {
		return nil, fmt.Errorf("suggest agents: %w", err)
	}
	defer rows.Close()

	var suggestions []models.AgentSuggestion
	for rows.Next() {
		var s models.AgentSuggestion
		if err := rows.Scan(&s.ID, &s.Name, &s.Category, &s.Price); err != nil {
			return nil, fmt.Errorf("scan suggestion: %w", err)
		}
		suggestions = append(suggestions, s)
	}
	return suggestions, nil
}

func (db *DB) IncrementDownloads(id int64) error {
	_, err := db.conn.Exec("UPDATE agents SET downloads = downloads + 1 WHERE id = ?", id)
	return err
}

// --- Purchases ---

func (db *DB) CreatePurchase(userID, agentID int64, purchaseType string, expiry *time.Time) (*models.Purchase, error) {
	res, err := db.conn.Exec(
		"INSERT INTO purchases (user_id, agent_id, type, expiry_date) VALUES (?, ?, ?, ?)",
		userID, agentID, purchaseType, expiry,
	)
	if err != nil {
		return nil, fmt.Errorf("create purchase: %w", err)
	}
	id, _ := res.LastInsertId()
	return &models.Purchase{
		ID:         id,
		UserID:     userID,
		AgentID:    agentID,
		Type:       purchaseType,
		ExpiryDate: expiry,
		CreatedAt:  time.Now(),
	}, nil
}

func (db *DB) GetUserPurchases(userID int64) ([]models.Purchase, error) {
	rows, err := db.conn.Query(
		"SELECT id, user_id, agent_id, type, expiry_date, created_at FROM purchases WHERE user_id = ? ORDER BY created_at DESC",
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("list purchases: %w", err)
	}
	defer rows.Close()

	var purchases []models.Purchase
	for rows.Next() {
		var p models.Purchase
		var expiry sql.NullTime
		if err := rows.Scan(&p.ID, &p.UserID, &p.AgentID, &p.Type, &expiry, &p.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan purchase: %w", err)
		}
		if expiry.Valid {
			p.ExpiryDate = &expiry.Time
		}
		purchases = append(purchases, p)
	}
	return purchases, nil
}

func (db *DB) GetUserFavorites(userID int64) ([]int64, error) {
	rows, err := db.conn.Query("SELECT agent_id FROM user_favorites WHERE user_id = ?", userID)
	if err != nil {
		return nil, fmt.Errorf("get user favorites: %w", err)
	}
	defer rows.Close()

	var ids []int64
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return nil, fmt.Errorf("scan favorite: %w", err)
		}
		ids = append(ids, id)
	}
	return ids, nil
}

func (db *DB) UpdateUserStripeID(userID int64, stripeID string) error {
	_, err := db.conn.Exec("UPDATE users SET stripe_id = ? WHERE id = ?", stripeID, userID)
	return err
}

// --- Reviews ---

func (db *DB) GetReviewsByAgent(agentID int64) ([]models.Review, error) {
	rows, err := db.conn.Query(
		"SELECT id, agent_id, username, avatar, text, rating, created_at FROM reviews WHERE agent_id = ? ORDER BY created_at DESC",
		agentID,
	)
	if err != nil {
		return nil, fmt.Errorf("list reviews: %w", err)
	}
	defer rows.Close()

	var reviews []models.Review
	for rows.Next() {
		var r models.Review
		if err := rows.Scan(&r.ID, &r.AgentID, &r.Username, &r.Avatar, &r.Text, &r.Rating, &r.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan review: %w", err)
		}
		reviews = append(reviews, r)
	}
	return reviews, nil
}

func (db *DB) GetAgentRating(agentID int64) (float64, int, error) {
	var avg sql.NullFloat64
	var count int
	err := db.conn.QueryRow(
		"SELECT AVG(CAST(rating AS REAL)), COUNT(*) FROM reviews WHERE agent_id = ?", agentID,
	).Scan(&avg, &count)
	if err != nil {
		return 0, 0, err
	}
	if !avg.Valid {
		return 0, 0, nil
	}
	return avg.Float64, count, nil
}

// SeedReviews populates reviews for agents that have none.
func (db *DB) SeedReviews() error {
	var count int
	if err := db.conn.QueryRow("SELECT COUNT(*) FROM reviews").Scan(&count); err != nil {
		return fmt.Errorf("count reviews: %w", err)
	}
	if count > 0 {
		return nil
	}

	rows, err := db.conn.Query("SELECT id, name, category FROM agents")
	if err != nil {
		return fmt.Errorf("list agents for seed: %w", err)
	}
	defer rows.Close()

	type agentInfo struct {
		id       int64
		name     string
		category string
	}
	var agents []agentInfo
	for rows.Next() {
		var a agentInfo
		if err := rows.Scan(&a.id, &a.name, &a.category); err != nil {
			return fmt.Errorf("scan agent for seed: %w", err)
		}
		agents = append(agents, a)
	}

	seedReviews := map[string][]struct {
		user   string
		avatar string
		text   string
		rating int
		date   string
	}{
		"NLP": {
			{"neo_coder", "https://api.dicebear.com/9.x/avataaars/svg?seed=neo", "Best NLP agent I have used. The summarization quality is insane.", 5, "2026-02-28"},
			{"data_witch", "https://api.dicebear.com/9.x/avataaars/svg?seed=witch", "Solid for document generation. Could use better streaming support.", 4, "2026-02-15"},
			{"ml_ronin", "https://api.dicebear.com/9.x/avataaars/svg?seed=ronin", "Handles complex prompts gracefully. Worth every penny.", 5, "2026-01-20"},
		},
		"Vision": {
			{"cv_empress", "https://api.dicebear.com/9.x/avataaars/svg?seed=empress", "Detection accuracy is top-tier. Latency could be better on CPU.", 4, "2026-03-10"},
			{"robo_sam", "https://api.dicebear.com/9.x/avataaars/svg?seed=sam", "Excellent multimodal support. Integrated into our pipeline in minutes.", 5, "2026-02-05"},
			{"art_hacker", "https://api.dicebear.com/9.x/avataaars/svg?seed=hacker", "Image quality rivals the best tools on the market. Local GPU mode is a huge plus.", 5, "2026-03-14"},
		},
		"Automation": {
			{"devops_ninja", "https://api.dicebear.com/9.x/avataaars/svg?seed=ninja", "Replaced 3 Zapier workflows with this. Incredibly flexible.", 5, "2026-03-12"},
			{"cloud_rider", "https://api.dicebear.com/9.x/avataaars/svg?seed=rider", "DAG builder is clean. Retry logic saved us during a production outage.", 5, "2026-02-28"},
			{"api_ghost", "https://api.dicebear.com/9.x/avataaars/svg?seed=ghost", "Good agent but documentation could be more detailed.", 4, "2026-01-15"},
		},
		"Analytics": {
			{"analytics_ace", "https://api.dicebear.com/9.x/avataaars/svg?seed=ace", "Anomaly detection caught a billing issue we missed for months. Paid for itself day one.", 5, "2026-03-05"},
			{"bi_baron", "https://api.dicebear.com/9.x/avataaars/svg?seed=baron", "Dashboards look great but custom SQL support needs work.", 4, "2026-02-10"},
			{"data_nomad", "https://api.dicebear.com/9.x/avataaars/svg?seed=nomad", "Schema discovery is magic. Generated correct JOINs across 12 tables.", 5, "2026-03-02"},
		},
		"Security": {
			{"sec_phantom", "https://api.dicebear.com/9.x/avataaars/svg?seed=phantom", "Found 14 critical vulns in our codebase that Snyk missed. Absolute unit.", 5, "2026-03-17"},
			{"pen_tester", "https://api.dicebear.com/9.x/avataaars/svg?seed=tester", "SOC2 report generation alone is worth the price. Clean and thorough.", 5, "2026-03-01"},
			{"blue_team", "https://api.dicebear.com/9.x/avataaars/svg?seed=blue", "DAST scanning is solid. Would love to see container image scanning next.", 4, "2026-02-20"},
		},
	}

	for _, a := range agents {
		cat := a.category
		reviews, ok := seedReviews[cat]
		if !ok {
			reviews = seedReviews["NLP"] // fallback
		}
		for _, rv := range reviews {
			_, err := db.conn.Exec(
				"INSERT INTO reviews (agent_id, username, avatar, text, rating, created_at) VALUES (?, ?, ?, ?, ?, ?)",
				a.id, rv.user, rv.avatar, rv.text, rv.rating, rv.date,
			)
			if err != nil {
				return fmt.Errorf("seed review for agent %d: %w", a.id, err)
			}
		}
	}
	return nil
}
