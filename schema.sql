CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    stripe_id TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('dev', 'user')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dev_id INTEGER NOT NULL REFERENCES users(id),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    version TEXT NOT NULL DEFAULT '1.0.0',
    price REAL NOT NULL DEFAULT 0.0,
    rental_price REAL,
    has_trial BOOLEAN NOT NULL DEFAULT 0,
    file_path TEXT,
    file_hash TEXT,
    category TEXT,
    downloads INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    agent_id INTEGER NOT NULL REFERENCES agents(id),
    type TEXT NOT NULL CHECK(type IN ('buy', 'rent')),
    expiry_date DATETIME,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agents_category ON agents(category);
CREATE INDEX IF NOT EXISTS idx_agents_dev_id ON agents(dev_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_name ON agents(name);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);

-- FTS5 virtual table for fast full-text search on agents
CREATE VIRTUAL TABLE IF NOT EXISTS agents_fts USING fts5(
    name,
    description,
    category,
    content='agents',
    content_rowid='id'
);

-- Triggers to keep FTS index in sync with agents table
CREATE TRIGGER IF NOT EXISTS agents_ai AFTER INSERT ON agents BEGIN
    INSERT INTO agents_fts(rowid, name, description, category)
    VALUES (new.id, new.name, new.description, new.category);
END;

CREATE TRIGGER IF NOT EXISTS agents_ad AFTER DELETE ON agents BEGIN
    INSERT INTO agents_fts(agents_fts, rowid, name, description, category)
    VALUES ('delete', old.id, old.name, old.description, old.category);
END;

CREATE TRIGGER IF NOT EXISTS agents_au AFTER UPDATE ON agents BEGIN
    INSERT INTO agents_fts(agents_fts, rowid, name, description, category)
    VALUES ('delete', old.id, old.name, old.description, old.category);
    INSERT INTO agents_fts(rowid, name, description, category)
    VALUES (new.id, new.name, new.description, new.category);
END;

CREATE TABLE IF NOT EXISTS user_favorites (
    user_id INTEGER NOT NULL REFERENCES users(id),
    agent_id INTEGER NOT NULL REFERENCES agents(id),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
