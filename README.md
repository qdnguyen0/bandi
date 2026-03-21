```
 ██████╗  █████╗ ███╗   ██╗██████╗ ░░╗ █████╗ ░░╗
 ██╔══██╗██╔══██╗████╗  ██║██╔══██╗██║██╔══██╗██║
 ██████╔╝███████║██╔██╗ ██║██║  ██║██║███████║██║
 ██╔══██╗██╔══██║██║╚██╗██║██║  ██║██║██╔══██║██║
 ██████╔╝██║  ██║██║ ╚████║██████╔╝██║██║  ██║██║
 ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ ╚═╝╚═╝  ╚═╝╚═╝
        A I   A G E N T   M A R K E T P L A C E
```

# BandiAI

**The Cyberpunk AI Agent Marketplace**

BandiAI is a full-stack marketplace where developers publish AI agents and users buy or rent them. It combines a Go REST API with a React frontend styled in a neon cyberpunk aesthetic.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│              React + Vite + Tailwind CSS                    │
│          (Marketplace, Agent Detail, Search)                │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP / JSON
┌──────────────────────────▼──────────────────────────────────┐
│                    Go HTTP Server                           │
│                  chi router  :8080                          │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Auth        │  │  Agents      │  │  Purchases       │   │
│  │  (JWT)       │  │  (upload/    │  │  (buy / rent)    │   │
│  └──────────────┘  │  download)   │  └──────────────────┘   │
│                    └──────────────┘                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Middleware: CORS · Rate Limit · Logger · Auth JWT   │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────┬──────────────────────┬─────────────────────┘
                 │                      │
    ┌────────────▼──────────┐   ┌───────▼──────────────────┐
    │  SQLite (modernc)     │   │  Stripe Webhook          │
    │  ./data/bandiAI.db    │   │  checkout.session.       │
    │                       │   │  completed               │
    │  users                │   └──────────────────────────┘
    │  agents               │
    │  purchases            │   ┌──────────────────────────┐
    └───────────────────────┘   │  File Vault              │
                                │  ./data/vault  (.tar.gz) │
                                │  SHA-256 integrity check │
                                └──────────────────────────┘
```

---

## Tech Stack

| Layer     | Technology                                          |
|-----------|-----------------------------------------------------|
| Backend   | Go 1.22, `chi` v5, `golang-jwt/jwt` v5              |
| Database  | SQLite via `modernc.org/sqlite` (no CGO required)   |
| Payments  | Stripe Go SDK v76                                   |
| Frontend  | React 18, TypeScript, Vite 5, Tailwind CSS 3        |
| UI        | Framer Motion, React Router v6, JetBrains Mono font |

---

## Project Structure

```
bandiAI/
├── cmd/
│   └── server/
│       └── main.go          # Entry point, router wiring
├── internal/
│   ├── config/
│   │   └── config.go        # Env-based configuration
│   ├── handlers/
│   │   ├── auth.go          # Register, login, /me
│   │   ├── agents.go        # List, get, create, download
│   │   ├── purchases.go     # Create purchase, list purchases
│   │   ├── stripe.go        # Stripe webhook handler
│   │   └── helpers.go       # JSON response helpers
│   ├── middleware/
│   │   ├── auth.go          # JWT Bearer token validation
│   │   ├── cors.go          # CORS headers
│   │   ├── logger.go        # Request logging
│   │   └── ratelimit.go     # Token-bucket rate limiter
│   ├── models/
│   │   └── models.go        # Domain types and request/response structs
│   └── storage/
│       └── sqlite.go        # SQLite data access layer
├── frontend/
│   ├── src/
│   │   ├── api.ts           # Typed API client
│   │   ├── types.ts         # TypeScript interfaces
│   │   ├── App.tsx          # Router shell
│   │   ├── components/      # Header, AgentCard, SearchPalette
│   │   └── pages/           # Marketplace, AgentDetail
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
├── data/                    # Created at runtime
│   ├── bandiAI.db           # SQLite database
│   └── vault/               # Uploaded agent archives
├── schema.sql               # Reference DDL
├── go.mod
└── go.sum
```

---

## Getting Started

### Prerequisites

- Go 1.22+
- Node 18+

### Quick Start

```bash
./start.sh
```

This single command installs dependencies, seeds the database with demo agents, and starts both the backend and frontend. Open **http://localhost:5173**.

### Manual Setup

```bash
# Backend dependencies
go mod tidy

# Frontend dependencies
cd frontend && npm install

# Create the data directory
mkdir -p data/vault

# Option A: Let the Go server create the DB schema, then seed
go run ./cmd/server/ &  # starts server, runs Migrate() to create tables
sleep 2 && kill %1
sqlite3 ./data/bandiAI.db -cmd "PRAGMA trusted_schema=ON;" < seed.sql

# Option B: Create DB from schema.sql directly, then seed
sqlite3 ./data/bandiAI.db < schema.sql
sqlite3 ./data/bandiAI.db -cmd "PRAGMA trusted_schema=ON;" < seed.sql
```

> **Note:** The `PRAGMA trusted_schema=ON` is required because `sqlite3` blocks
> virtual table triggers (FTS5) in safe mode when reading from stdin/files.
> Without it you'll get: `Parse error: unsafe use of virtual table "agents_fts"`.
> On SQLite 3.46+ you can use `sqlite3 -unsafe` instead.

### Running

Start the backend (serves the API on port 8080):

```bash
go run ./cmd/server/
```

Start the frontend dev server (proxies API requests to the backend):

```bash
cd frontend && npm run dev
```

The frontend dev server runs at `http://localhost:5173`. The production build is served by the Go server at `http://localhost:8080`.

To build the frontend for production:

```bash
cd frontend && npm run build
```

---

## Environment Variables

| Variable                 | Default                              | Required | Description                                      |
|--------------------------|--------------------------------------|----------|--------------------------------------------------|
| `JWT_SECRET`             | `bandiAI-dev-secret-change-me`       | Yes      | HMAC-SHA256 secret for signing JWT tokens        |
| `STRIPE_KEY`             | —                                    | No       | Stripe secret key (enables payment processing)   |
| `STRIPE_WEBHOOK_SECRET`  | —                                    | No       | Stripe webhook signing secret                    |
| `DB_PATH`                | `./data/bandiAI.db`                  | No       | Path to the SQLite database file                 |
| `VAULT_PATH`             | `./data/vault`                       | No       | Directory where uploaded agent archives are stored |
| `PORT`                   | `8080`                               | No       | HTTP port the server listens on                  |

> **Warning:** The default `JWT_SECRET` is for development only. Always set a strong secret in production.

---

## Frontend Theme

The UI uses a cyberpunk color palette defined in `frontend/tailwind.config.js`:

| Token            | Hex       | Use                              |
|------------------|-----------|----------------------------------|
| `deepSpace`      | `#020205` | Page background                  |
| `neonCyan`       | `#00ffff` | Primary accent, borders, glows   |
| `voltagePurple`  | `#7f00ff` | Gradient midpoint                |
| `neonPink`       | `#ff00ff` | Gradient endpoint, highlights    |

Typography uses **JetBrains Mono** (body/code) and **Orbitron** (display headings), loaded from Google Fonts.

---

## Testing

### Backend (Go)

Run all Go tests:

```bash
go test ./...
```

Run with verbose output:

```bash
go test ./internal/... -v
```

Run with coverage summary:

```bash
go test ./internal/... -cover
```

Generate an HTML coverage report:

```bash
go test ./internal/... -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html
open coverage.html
```

**Current coverage:**

| Package              | Coverage |
|----------------------|----------|
| `internal/handlers`  | 17.1%    |
| `internal/storage`   | 15.5%    |

Key tested functions: `GetActivePurchase` (90%), `CreatePurchase` (80%), `Checkout` handler (51%), `Create` handler (61%), `Status` handler (64%).

### Frontend (React)

Run all frontend tests:

```bash
cd frontend && npm test
```

Run with coverage:

```bash
cd frontend && npx vitest run --coverage
```

Run in watch mode during development:

```bash
cd frontend && npx vitest
```

**Current coverage:**

| File               | Stmts  | Branch | Funcs  | Lines  |
|--------------------|--------|--------|--------|--------|
| AuthModal.tsx      | 87.0%  | 92.0%  | 71.4%  | 88.0%  |
| CheckoutModal.tsx  | 76.7%  | 83.3%  | 61.5%  | 76.9%  |
| AgentDetail.tsx    | 52.6%  | 39.4%  | 35.9%  | 57.0%  |

---

## License

MIT
