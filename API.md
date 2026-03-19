# BandiAI API Reference

Base URL: `http://localhost:8080`

All request and response bodies are JSON. Protected endpoints require a `Bearer` token in the `Authorization` header obtained from `/api/auth/login` or `/api/auth/register`. Tokens are signed with HS256 and expire after 72 hours.

**Rate limit:** 10 requests/second per IP, burst of 20.

---

## Authentication

### POST /api/auth/register

Create a new account. Returns a JWT and the created user.

**Request body**

| Field      | Type   | Required | Description                        |
|------------|--------|----------|------------------------------------|
| `email`    | string | Yes      | Must be unique                     |
| `password` | string | Yes      |                                    |
| `role`     | string | No       | `"user"` (default) or `"dev"`      |

```json
{
  "email": "ada@example.com",
  "password": "s3cr3t",
  "role": "dev"
}
```

**Response** `201 Created`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "ada@example.com",
    "stripe_id": "",
    "role": "dev",
    "created_at": "2026-03-19T10:00:00Z"
  }
}
```

**Errors**

| Status | Body                                      | Cause                         |
|--------|-------------------------------------------|-------------------------------|
| 400    | `{"error":"email and password required"}` | Missing field                 |
| 400    | `{"error":"role must be 'user' or 'dev'"}`| Invalid role value            |
| 409    | `{"error":"email already exists"}`        | Duplicate email               |

---

### POST /api/auth/login

Authenticate an existing user. Returns a JWT and the user object.

**Request body**

```json
{
  "email": "ada@example.com",
  "password": "s3cr3t"
}
```

**Response** `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "ada@example.com",
    "stripe_id": "",
    "role": "dev",
    "created_at": "2026-03-19T10:00:00Z"
  }
}
```

**Errors**

| Status | Body                              | Cause                   |
|--------|-----------------------------------|-------------------------|
| 401    | `{"error":"invalid credentials"}` | Wrong email or password |

---

### GET /api/auth/me

**Protected.** Returns the currently authenticated user.

**Request headers**

```
Authorization: Bearer <token>
```

**Response** `200 OK`

```json
{
  "id": 1,
  "email": "ada@example.com",
  "stripe_id": "",
  "role": "dev",
  "created_at": "2026-03-19T10:00:00Z"
}
```

**Errors**

| Status | Body                           | Cause                                        |
|--------|--------------------------------|----------------------------------------------|
| 401    | `{"error":"missing token"}`    | No Authorization header                      |
| 401    | `{"error":"invalid token"}`    | Expired or invalid JWT                       |
| 404    | `{"error":"user not found"}`   | User deleted after token was issued          |

---

## Agents

### GET /api/agents

List agents with optional search and category filtering. Results are paginated.

**Query parameters**

| Parameter  | Type    | Default | Description                                       |
|------------|---------|---------|---------------------------------------------------|
| `search`   | string  | —       | Full-text filter on name and description          |
| `category` | string  | —       | Filter by category (e.g. `NLP`, `Vision`)         |
| `page`     | integer | `1`     | Page number (1-indexed)                           |
| `limit`    | integer | `20`    | Items per page (1–50)                             |

**Example**

```
GET /api/agents?category=NLP&search=translate&page=1&limit=10
```

**Response** `200 OK`

```json
{
  "agents": [
    {
      "id": 6,
      "dev_id": 2,
      "name": "LangBridge Translator",
      "description": "Multi-lingual neural translation agent with context-aware cultural adaptation for 100+ languages.",
      "version": "2.1.0",
      "price": 29.00,
      "rental_price": 5.00,
      "has_trial": true,
      "file_hash": "a3f5c2d...",
      "category": "NLP",
      "downloads": 34521,
      "created_at": "2024-01-10T00:00:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

---

### GET /api/agents/{id}

Fetch a single agent by ID.

**Path parameters**

| Parameter | Type    | Description |
|-----------|---------|-------------|
| `id`      | integer | Agent ID    |

**Response** `200 OK`

```json
{
  "id": 1,
  "dev_id": 1,
  "name": "NeuralScribe Pro",
  "description": "Advanced language model agent for document generation, summarization, and intelligent text transformation.",
  "version": "1.0.0",
  "price": 49.00,
  "rental_price": 9.00,
  "has_trial": true,
  "file_hash": "b8e4a1f...",
  "category": "NLP",
  "downloads": 12847,
  "created_at": "2024-01-15T00:00:00Z"
}
```

**Errors**

| Status | Body                          | Cause           |
|--------|-------------------------------|-----------------|
| 400    | `{"error":"invalid id"}`      | Non-integer ID  |
| 404    | `{"error":"agent not found"}` | ID not in DB    |

---

### POST /api/agents

**Protected. Requires `dev` role.** Upload a new agent. Uses `multipart/form-data` (50 MB max).

**Request headers**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form fields**

| Field          | Type   | Required | Description                                          |
|----------------|--------|----------|------------------------------------------------------|
| `name`         | string | Yes      | Agent display name                                   |
| `version`      | string | Yes      | Semantic version string (e.g. `1.0.0`)               |
| `description`  | string | No       | Markdown-friendly description                        |
| `category`     | string | No       | Category label (e.g. `NLP`, `Vision`)                |
| `price`        | float  | No       | Purchase price in USD (default `0`)                  |
| `rental_price` | float  | No       | Monthly rental price in USD; omit to disable renting |
| `has_trial`    | string | No       | `"true"` to enable free trial access                 |
| `file`         | file   | No       | Agent archive; stored as `.tar.gz` in the vault      |

Files are saved to `VAULT_PATH` with a SHA-256 integrity hash computed on upload.

**Response** `201 Created`

```json
{
  "id": 7,
  "dev_id": 1,
  "name": "CodeReview Agent",
  "description": "Automated code review with security analysis.",
  "version": "1.0.0",
  "price": 59.00,
  "rental_price": 10.00,
  "has_trial": false,
  "file_hash": "c9d3b2e...",
  "category": "Automation",
  "downloads": 0,
  "created_at": "2026-03-19T10:00:00Z"
}
```

**Errors**

| Status | Body                                            | Cause                          |
|--------|-------------------------------------------------|--------------------------------|
| 400    | `{"error":"name and version required"}`         | Missing required fields        |
| 403    | `{"error":"only developers can upload agents"}` | User role is not `dev`         |

---

### GET /api/agents/{id}/download

**Protected.** Download the agent archive file. Responds with the file as `application/gzip` with `Content-Disposition: attachment`. The download counter for the agent is incremented on each successful request.

**Request headers**

```
Authorization: Bearer <token>
```

**Response** `200 OK` — binary file stream

```
Content-Disposition: attachment; filename="agent-name.tar.gz"
Content-Type: application/gzip
```

**Errors**

| Status | Body                            | Cause                              |
|--------|---------------------------------|------------------------------------|
| 400    | `{"error":"invalid id"}`        | Non-integer ID                     |
| 404    | `{"error":"agent not found"}`   | ID not in DB                       |
| 404    | `{"error":"no file available"}` | Agent has no uploaded file         |

---

## Purchases

### POST /api/purchases

**Protected.** Record a purchase for the authenticated user.

**Request headers**

```
Authorization: Bearer <token>
```

**Request body**

| Field      | Type    | Required | Description                 |
|------------|---------|----------|-----------------------------|
| `agent_id` | integer | Yes      | ID of the agent to acquire  |
| `type`     | string  | Yes      | `"buy"` or `"rent"`         |

```json
{
  "agent_id": 3,
  "type": "rent"
}
```

- `buy` — permanent access, no expiry.
- `rent` — access expires 30 days from the purchase timestamp. Returns `400` if the agent has no `rental_price` set.

**Response** `201 Created`

```json
{
  "id": 12,
  "user_id": 1,
  "agent_id": 3,
  "type": "rent",
  "expiry_date": "2026-04-18T10:00:00Z",
  "created_at": "2026-03-19T10:00:00Z"
}
```

For a `buy` purchase, `expiry_date` is omitted from the response.

**Errors**

| Status | Body                                           | Cause                           |
|--------|------------------------------------------------|---------------------------------|
| 400    | `{"error":"type must be 'buy' or 'rent'"}`     | Invalid type value              |
| 400    | `{"error":"agent not available for rent"}`     | Agent has no `rental_price`     |
| 404    | `{"error":"agent not found"}`                  | `agent_id` does not exist       |

---

### GET /api/purchases

**Protected.** List all purchases made by the authenticated user.

**Request headers**

```
Authorization: Bearer <token>
```

**Response** `200 OK`

```json
[
  {
    "id": 12,
    "user_id": 1,
    "agent_id": 3,
    "type": "rent",
    "expiry_date": "2026-04-18T10:00:00Z",
    "created_at": "2026-03-19T10:00:00Z"
  },
  {
    "id": 8,
    "user_id": 1,
    "agent_id": 1,
    "type": "buy",
    "created_at": "2026-02-01T08:30:00Z"
  }
]
```

---

## Webhooks

### POST /api/webhooks/stripe

Receives Stripe webhook events. The request body is verified against the `Stripe-Signature` header using `STRIPE_WEBHOOK_SECRET`.

Currently handles `checkout.session.completed`. All other event types are acknowledged and logged.

**Request headers**

```
Stripe-Signature: t=...,v1=...
Content-Type: application/json
```

**Response** `200 OK`

```json
{
  "received": true
}
```

**Errors**

| Status | Body                             | Cause                          |
|--------|----------------------------------|--------------------------------|
| 400    | `{"error":"invalid signature"}`  | Signature verification failed  |

---

## Error Format

All errors use the same JSON envelope:

```json
{
  "error": "description of what went wrong"
}
```

## HTTP Status Codes

| Code | Meaning               |
|------|-----------------------|
| 200  | OK                    |
| 201  | Created               |
| 400  | Bad request           |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not found             |
| 409  | Conflict              |
| 429  | Rate limit exceeded   |
| 500  | Internal server error |
