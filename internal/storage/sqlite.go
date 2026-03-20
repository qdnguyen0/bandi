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

func (db *DB) GetReviewsByAgent(agentID int64, page, limit int) ([]models.Review, int, error) {
	var total int
	err := db.conn.QueryRow("SELECT COUNT(*) FROM reviews WHERE agent_id = ?", agentID).Scan(&total)
	if err != nil {
		return nil, 0, fmt.Errorf("count reviews: %w", err)
	}

	offset := (page - 1) * limit
	rows, err := db.conn.Query(
		"SELECT id, agent_id, username, avatar, text, rating, created_at FROM reviews WHERE agent_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
		agentID, limit, offset,
	)
	if err != nil {
		return nil, 0, fmt.Errorf("list reviews: %w", err)
	}
	defer rows.Close()

	var reviews []models.Review
	for rows.Next() {
		var r models.Review
		if err := rows.Scan(&r.ID, &r.AgentID, &r.Username, &r.Avatar, &r.Text, &r.Rating, &r.CreatedAt); err != nil {
			return nil, 0, fmt.Errorf("scan review: %w", err)
		}
		reviews = append(reviews, r)
	}
	return reviews, total, nil
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

	rows, err := db.conn.Query("SELECT id, name, category, downloads FROM agents ORDER BY id")
	if err != nil {
		return fmt.Errorf("list agents for seed: %w", err)
	}
	defer rows.Close()

	type agentInfo struct {
		id        int64
		name      string
		category  string
		downloads int
	}
	var agents []agentInfo
	for rows.Next() {
		var a agentInfo
		if err := rows.Scan(&a.id, &a.name, &a.category, &a.downloads); err != nil {
			return fmt.Errorf("scan agent for seed: %w", err)
		}
		agents = append(agents, a)
	}

	// Review counts by agent ID — most-downloaded AutoFlow gets 114,
	// others vary to average ~30 across all 10 agents.
	reviewCounts := map[int64]int{
		1: 28, 2: 18, 3: 114, 4: 8, 5: 15,
		6: 47, 7: 6, 8: 38, 9: 22, 10: 12,
	}

	usernames := []string{
		"neo_coder", "data_witch", "ml_ronin", "cv_empress", "robo_sam",
		"art_hacker", "devops_ninja", "cloud_rider", "api_ghost", "analytics_ace",
		"bi_baron", "data_nomad", "sec_phantom", "pen_tester", "blue_team",
		"tensor_flow", "gradient_guy", "neural_nyx", "byte_sage", "pixel_punk",
		"code_reaper", "algo_queen", "stack_wolf", "node_nomad", "shell_shock",
		"git_wizard", "rust_rider", "py_phantom", "java_jinx", "go_guru",
		"lambda_lord", "docker_diva", "kube_king", "redis_raven", "sql_samurai",
		"graphql_ghost", "api_alchemist", "css_cyborg", "react_rebel", "vue_viper",
		"svelte_sage", "next_ninja", "deno_demon", "bun_bandit", "wasm_warlock",
		"llm_lord", "rag_ronin", "finetune_fox", "embed_eagle", "prompt_pirate",
		"token_titan", "chain_chief", "agent_ace", "model_monk", "bench_boss",
		"infra_imp", "ops_oracle", "sre_sphinx", "cloud_cobra", "net_ninja",
		"sec_samurai", "vuln_viking", "pen_prophet", "soc_sentinel", "zero_day",
		"data_duke", "etl_elf", "spark_sage", "kafka_knight", "beam_bard",
		"dash_druid", "chart_chief", "metric_mage", "alert_ace", "log_lord",
		"ci_cyborg", "cd_champion", "pipe_paladin", "test_titan", "lint_legend",
		"build_boss", "deploy_duke", "release_rogue", "stage_sage", "prod_prophet",
		"debug_demon", "trace_titan", "heap_hunter", "leak_lord", "perf_phantom",
		"cache_cobra", "queue_queen", "batch_baron", "stream_sage", "event_elf",
		"hook_hawk", "plugin_punk", "ext_eagle", "mod_monk", "patch_pirate",
		"fork_fox", "merge_mage", "branch_boss", "tag_titan", "commit_chief",
		"diff_duke", "blame_bard", "stash_sage", "rebase_rogue", "cherry_chief",
	}

	reviewTexts := map[string][]string{
		"NLP": {
			"Best NLP agent I have used. The summarization quality is insane.",
			"Solid for document generation. Could use better streaming support.",
			"Handles complex prompts gracefully. Worth every penny.",
			"The chain-of-thought reasoning is a game changer for my workflow.",
			"Structured output formatting saved us weeks of post-processing.",
			"Prompt engineering with this agent is a breeze. Super intuitive.",
			"Enterprise-grade text transformation at a fraction of the cost.",
			"Outperforms GPT wrappers I've tried. Genuinely impressed.",
			"Summarization is near-perfect. Occasionally misses nuance in legal docs.",
			"Multilingual prompting works better than expected. Great for i18n teams.",
			"Text classification accuracy is outstanding across domains.",
			"The response latency is impressive for a model this capable.",
			"Used it for 6 months now. Consistently reliable in production.",
			"Only giving 4 stars because batch mode could be faster.",
			"Customer support was super responsive when I hit a config issue.",
			"Replaced our entire NLP pipeline with this single agent.",
			"The contextual understanding of long documents is remarkable.",
			"Formatting templates are flexible and well-documented.",
			"Great agent but wish it had native PDF parsing built in.",
			"Our content team loves it. Drafts are nearly publish-ready.",
			"Token efficiency is better than competitors by a wide margin.",
			"Semantic search integration works flawlessly with our vector DB.",
			"The few-shot learning capability is underrated. Works beautifully.",
			"Rock solid uptime. Haven't seen a single failure in 3 months.",
			"Perfect for regulatory compliance document generation.",
			"Would be 5 stars if the API rate limits were more generous.",
			"Fine-tuning support puts this leagues ahead of alternatives.",
			"Handles ambiguous queries remarkably well. Great fallback logic.",
			"The entity extraction module alone is worth the subscription.",
			"Integrated into our Slack bot in under an hour. So clean.",
		},
		"Vision": {
			"Detection accuracy is top-tier. Latency could be better on CPU.",
			"Excellent multimodal support. Integrated into our pipeline in minutes.",
			"Image quality rivals the best tools on the market. Local GPU mode is a huge plus.",
			"OCR accuracy on handwritten documents blew my mind.",
			"Real-time object detection runs smoother than our previous YOLO setup.",
			"Visual QA responses are contextually aware and accurate.",
			"The segmentation masks are pixel-perfect. Outstanding work.",
			"Processing 10K images in batch mode was surprisingly fast.",
			"Style transfer outputs are gallery-worthy. Clients love the results.",
			"Upscaling from 480p to 4K looks incredibly natural.",
			"Inpainting results are seamless. Even our designers couldn't tell.",
			"The model handles edge cases in medical imaging really well.",
			"Satellite image analysis was more accurate than dedicated GIS tools.",
			"Face detection works across diverse demographics without bias issues.",
			"Video frame analysis at 60fps with barely any latency.",
			"The API is clean and well-typed. Easy integration with TypeScript.",
			"Batch processing throughput exceeded our expectations by 3x.",
			"Works great for quality control on our manufacturing line.",
			"Document layout analysis is perfect for invoice processing.",
			"Best image generation agent I've tested this year. Period.",
			"Multi-label classification accuracy is consistently above 97%.",
			"The confidence scores are well-calibrated. Great for thresholding.",
			"Handles noisy images better than any other model I've benchmarked.",
			"GPU memory footprint is surprisingly small for the quality you get.",
			"Custom fine-tuning on our dataset took only 2 hours. Great docs.",
			"Image-to-text descriptions are natural and contextually rich.",
			"Edge deployment on Jetson Nano works perfectly. Great optimization.",
			"The model handles extreme lighting conditions gracefully.",
			"Our radiology team is impressed with the diagnostic assistance.",
			"Panoramic stitching is better than Photoshop's auto-merge.",
		},
		"Automation": {
			"Replaced 3 Zapier workflows with this. Incredibly flexible.",
			"DAG builder is clean. Retry logic saved us during a production outage.",
			"Good agent but documentation could be more detailed.",
			"Webhook integration is seamless. Connected 12 services in a day.",
			"The visual pipeline editor is intuitive even for non-technical users.",
			"Error handling and rollback mechanisms are enterprise-grade.",
			"Scheduling engine is precise. Jobs run within 100ms of target time.",
			"Parallel execution of tasks cut our pipeline time by 70%.",
			"Slack and Discord alerts are incredibly useful for monitoring.",
			"Template library saved us from building common workflows from scratch.",
			"Custom function nodes let us extend functionality easily.",
			"The condition branching logic is powerful yet simple to configure.",
			"Running 500+ automated workflows daily without a single hiccup.",
			"API rate limit handling is built in. No more 429 headaches.",
			"The audit log for workflow executions is thorough and searchable.",
			"Multi-cloud support works as advertised. AWS to GCP migrations were smooth.",
			"Version control for workflows is a brilliant feature.",
			"Cron expression support is comprehensive. Even complex schedules work.",
			"Data transformation steps handle edge cases gracefully.",
			"The dead-letter queue integration prevents silent failures.",
			"Idempotency support out of the box. Huge for payment workflows.",
			"Environment variable management across staging/prod is clean.",
			"Supports both sync and async execution patterns natively.",
			"Built our entire onboarding automation in under a week.",
			"The step function visualization makes debugging a breeze.",
			"OAuth flow automation for third-party services just works.",
			"Cost tracking per workflow is a nice touch for budgeting.",
			"We migrated from Airflow and haven't looked back.",
			"Real-time execution monitoring caught an issue before it hit users.",
			"The agent marketplace for reusable workflow components is genius.",
		},
		"Analytics": {
			"Anomaly detection caught a billing issue we missed for months. Paid for itself day one.",
			"Dashboards look great but custom SQL support needs work.",
			"Schema discovery is magic. Generated correct JOINs across 12 tables.",
			"Natural language to SQL accuracy is impressive for complex queries.",
			"Real-time dashboard rendering is snappy even with millions of rows.",
			"The forecasting models are surprisingly accurate for our sales data.",
			"Auto-generated executive summaries save our team hours weekly.",
			"BigQuery connector is blazing fast. Sub-second query times.",
			"Customizable alert thresholds caught a revenue anomaly instantly.",
			"The drill-down capability in dashboards is intuitive and powerful.",
			"Cohort analysis features rival dedicated product analytics tools.",
			"Cross-database joins work seamlessly. Postgres + Snowflake + BigQuery.",
			"The chart styling options are beautiful. Clients love the reports.",
			"Scheduled report delivery to Slack channels is a time saver.",
			"Handles temporal data aggregation correctly. No more timezone bugs.",
			"The data lineage visualization helped us debug a pipeline issue.",
			"Embedded analytics in our SaaS product using the API. Clean integration.",
			"Row-level security implementation is straightforward and reliable.",
			"The metric definitions are reusable across dashboards. DRY analytics.",
			"A/B test analysis module gives clear statistical significance results.",
			"Data quality monitoring alerts us before dashboards show bad data.",
			"The semantic layer abstracts away complex table relationships.",
			"Export to PDF maintains formatting perfectly. Great for board decks.",
			"Incremental refresh for large datasets keeps dashboards snappy.",
			"Funnel analysis visualization is the best I've seen in any BI tool.",
			"The saved views feature helps organize analysis for different teams.",
			"Multi-tenant data isolation is rock solid. Perfect for our SaaS.",
			"Usage analytics on dashboards help us understand what reports matter.",
			"Version history on queries is a lifesaver when things break.",
			"Benchmarking against industry data adds great context to our metrics.",
		},
		"Security": {
			"Found 14 critical vulns in our codebase that Snyk missed. Absolute unit.",
			"SOC2 report generation alone is worth the price. Clean and thorough.",
			"DAST scanning is solid. Would love to see container image scanning next.",
			"Dependency auditing caught a zero-day before it was published in NVD.",
			"Secrets detection found 8 leaked API keys in our monorepo. Yikes.",
			"The SAST engine understands complex data flows across microservices.",
			"ISO 27001 compliance mapping saved our security team weeks of work.",
			"Behavioral analysis flagged an insider threat we never would have caught.",
			"Integration with our CI/CD pipeline was frictionless.",
			"False positive rate is impressively low compared to other SAST tools.",
			"The remediation suggestions are actionable, not just theoretical.",
			"Custom rule authoring lets us encode our org-specific security policies.",
			"Network traffic analysis caught suspicious exfiltration patterns.",
			"The vulnerability timeline view helps prioritize what to fix first.",
			"API security testing found auth bypass issues our pen test missed.",
			"License compliance scanning is a bonus feature we didn't expect.",
			"Container security scanning was added recently and works great.",
			"The threat model generation for new features saves planning time.",
			"IaC scanning for Terraform and CloudFormation is comprehensive.",
			"Encryption-at-rest validation across all our services in one scan.",
			"The risk scoring model is well-calibrated for enterprise environments.",
			"Compliance dashboard gives our CISO a single pane of glass.",
			"Mobile app security testing found issues our internal team missed.",
			"The integration with Jira auto-creates tickets for findings. Love it.",
			"Supply chain security analysis on our npm dependencies is thorough.",
			"Pen test report generation in multiple formats: PDF, HTML, JSON.",
			"The agent explains vulnerabilities clearly for non-security engineers.",
			"Runtime protection mode caught a SQL injection in production. Saved us.",
			"Cloud misconfiguration detection across AWS, GCP, and Azure.",
			"The security training recommendations for developers are spot on.",
		},
	}

	// Deterministic rating distribution (skewed toward 4-5 stars)
	ratings := []int{5, 5, 5, 5, 5, 4, 4, 4, 4, 3, 5, 5, 4, 5, 4, 5, 5, 3, 4, 5}

	tx, err := db.conn.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare("INSERT INTO reviews (agent_id, username, avatar, text, rating, created_at) VALUES (?, ?, ?, ?, ?, ?)")
	if err != nil {
		return fmt.Errorf("prepare: %w", err)
	}
	defer stmt.Close()

	for _, a := range agents {
		n := reviewCounts[a.id]
		if n == 0 {
			n = 10
		}
		texts := reviewTexts[a.category]
		if texts == nil {
			texts = reviewTexts["NLP"]
		}

		for i := 0; i < n; i++ {
			user := usernames[i%len(usernames)]
			avatar := fmt.Sprintf("https://api.dicebear.com/9.x/avataaars/svg?seed=%s", user)
			text := texts[i%len(texts)]
			rating := ratings[i%len(ratings)]
			// Spread dates from 2025-09-01 to 2026-03-18
			dayOffset := (i * 197) % 199 // spread across ~199 days
			date := fmt.Sprintf("2025-09-%02d", 1+dayOffset%30)
			month := 9 + dayOffset/30
			year := 2025
			if month > 12 {
				month -= 12
				year = 2026
			}
			day := 1 + dayOffset%28
			date = fmt.Sprintf("%d-%02d-%02d", year, month, day)

			if _, err := stmt.Exec(a.id, user, avatar, text, rating, date); err != nil {
				return fmt.Errorf("seed review for agent %d: %w", a.id, err)
			}
		}
	}

	return tx.Commit()
}
