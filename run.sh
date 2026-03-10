#!/bin/bash
set -e

PORT=11000
# SQLite needs a local filesystem (not SMB/NFS)
DATA_DIR="${AGENTHUB_DATA:-/tmp/agenthub-data}"
ADMIN_KEY="${AGENTHUB_ADMIN_KEY:-admin}"

# Kill anything on the port
lsof -ti ":$PORT" 2>/dev/null | xargs kill -9 2>/dev/null || true

# Build
echo "Building..."
go build -o agenthub-server ./cmd/agenthub-server

# Run in background
echo "Starting on http://localhost:$PORT"
./agenthub-server --admin-key "$ADMIN_KEY" --data "$DATA_DIR" --listen ":$PORT" &
echo "PID: $!"

# Open browser
sleep 1
open "http://localhost:$PORT"
