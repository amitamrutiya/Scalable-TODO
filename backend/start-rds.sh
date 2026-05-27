#!/bin/bash
# ============================================
# Start Todo Backend with Amazon RDS
# ============================================

set -e

cd "$(dirname "$0")"

echo "🚀 Starting Todo Backend with Amazon RDS"
echo "=========================================="

# Verify AWS credentials
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo "❌ AWS credentials not configured"
    exit 1
fi

# Configuration
export RDS_HOSTNAME="database-2.cluster-c4v8260a8z2i.us-east-1.rds.amazonaws.com"
export RDS_PORT="5432"
export RDS_DB_NAME="todoapp"
export RDS_USERNAME="postgres"

# Generate auth token
echo "🔑 Generating RDS IAM auth token..."
export RDS_AUTH_TOKEN=$(aws rds generate-db-auth-token \
    --hostname "$RDS_HOSTNAME" \
    --port "$RDS_PORT" \
    --username "$RDS_USERNAME" \
    --region us-east-1 2>&1)

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate auth token:"
    echo "$RDS_AUTH_TOKEN"
    exit 1
fi

echo "✅ Auth token generated"

# Server config
export NODE_ENV=production
export PORT="${PORT:-3000}"
export JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 48)}"
export LOG_LEVEL=info

# Download CA cert
if [ ! -f "/tmp/rds-combined-ca-bundle.pem" ]; then
    echo "📜 Downloading RDS CA certificate..."
    curl -sSL "https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem" \
        -o /tmp/rds-combined-ca-bundle.pem
    echo "✅ CA certificate downloaded"
fi

# Build if dist doesn't exist or is older than src
if [ ! -d "dist" ] || [ "$(find src -newer dist -print -quit 2>/dev/null)" ]; then
    echo "📦 Building TypeScript..."
    npm run build
    echo "✅ Build complete"
fi

# Initialize schema
echo "📊 Ensuring database schema..."
node -e "
const { initializeDatabase } = require('./dist/scripts/init-rds');
initializeDatabase().catch(err => {
  console.log('Schema init:', err.message);
});
" 2>&1 | grep -v "^$" | tail -3

echo ""
echo "🌐 Server Starting..."
echo "   Port: $PORT"
echo "   Database: $RDS_DB_NAME@$RDS_HOSTNAME"
echo "   Health: http://localhost:$PORT/health"
echo "   API: http://localhost:$PORT/api/v1"
echo ""

# Start server using compiled JS (avoids ts-node issues)
exec node dist/index.js