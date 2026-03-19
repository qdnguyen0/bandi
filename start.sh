#!/bin/bash
set -e

cd "$(dirname "$0")"

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
  echo "Installing frontend dependencies..."
  (cd frontend && npm install)
fi

# Seed database if it doesn't exist
if [ ! -f "./data/bandiAI.db" ]; then
  echo "Initializing database..."
  mkdir -p ./data/vault
  go run ./cmd/server/ &
  SERVER_PID=$!
  sleep 2
  kill $SERVER_PID 2>/dev/null || true
  wait $SERVER_PID 2>/dev/null || true
  echo "Seeding demo data..."
  sqlite3 ./data/bandiAI.db "PRAGMA trusted_schema=ON;" ".read seed.sql"
fi

echo "Starting BandiAI..."
echo ""
echo "  Backend:  http://localhost:8080"
echo "  Frontend: http://localhost:5173"
echo ""

# Start backend
go run ./cmd/server/ &
BACKEND_PID=$!

# Start frontend
(cd frontend && npm run dev) &
FRONTEND_PID=$!

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT

wait
