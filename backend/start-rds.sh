#!/bin/bash
# ============================================
# Quick Start: Backend with Amazon RDS
# ============================================

set -e

# Change to backend directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Starting Todo Backend with Amazon RDS"
echo "=========================================="

# Generate auth token and export all env vars
export RDS_HOSTNAME="database-2.cluster-c4v8260a8z2i.us-east-1.rds.amazonaws.com"
export RDS_PORT="5432"
export RDS_DB_NAME="todoapp"
export RDS_USERNAME="postgres"
export NODE_ENV="production"
export PORT="${PORT:-3000}"

# Generate IAM token (15 min validity)
echo "🔑 Generating RDS auth token..."
export RDS_AUTH_TOKEN=$(aws rds generate-db-auth-token \
    --hostname "$RDS_HOSTNAME" \
    --port "$RDS_PORT" \
    --username "$RDS_USERNAME" \
    --region us-east-1)

echo "✅ Auth token generated"

# Download CA cert if needed
if [ ! -f "/tmp/rds-combined-ca-bundle.pem" ]; then
    echo "📜 Downloading CA certificate..."
    curl -sSL "https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem" -o /tmp/rds-combined-ca-bundle.pem
    echo "✅ CA certificate downloaded"
fi

# Init schema if needed
echo "📊 Ensuring database schema..."
npx ts-node src/scripts/init-rds.ts 2>&1 | grep -E "Connected|initialized|already exists" || true

# Generate JWT secret if not set
if [ -z "$JWT_SECRET" ]; then
    export JWT_SECRET=$(openssl rand -base64 48)
fi

echo ""
echo "🌐 Server Configuration:"
echo "   URL: http://localhost:$PORT"
echo "   Health: http://localhost:$PORT/health"
echo "   API: http://localhost:$PORT/api/v1"
echo "   RDS: $RDS_DB_NAME@$RDS_HOSTNAME"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start server
exec npx ts-node src/index.ts