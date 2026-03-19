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

func (db *DB) CreateUser(email, passwordHash, role string) (*models.User, error) {
	res, err := db.conn.Exec(
		"INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
		email, passwordHash, role,
	)
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	id, _ := res.LastInsertId()
	return &models.User{
		ID:    id,
		Email: email,
		Role:  role,
	}, nil
}

func (db *DB) GetUserByEmail(email string) (*models.User, error) {
	u := &models.User{}
	err := db.conn.QueryRow(
		"SELECT id, email, password_hash, COALESCE(stripe_id,''), role, created_at FROM users WHERE email = ?",
		email,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.StripeID, &u.Role, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return u, nil
}

func (db *DB) GetUserByID(id int64) (*models.User, error) {
	u := &models.User{}
	err := db.conn.QueryRow(
		"SELECT id, email, password_hash, COALESCE(stripe_id,''), role, created_at FROM users WHERE id = ?",
		id,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.StripeID, &u.Role, &u.CreatedAt)
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

func (db *DB) UpdateUserStripeID(userID int64, stripeID string) error {
	_, err := db.conn.Exec("UPDATE users SET stripe_id = ? WHERE id = ?", stripeID, userID)
	return err
}
