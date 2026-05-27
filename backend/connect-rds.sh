#!/bin/bash
# Quick Start - Connect Backend to RDS
set -e

RDS_HOST="database-2.cluster-c4v8260a8z2i.us-east-1.rds.amazonaws.com"
RDS_PORT="5432"
RDS_DB="todoapp"
RDS_USER="postgres"
REGION="us-east-1"

echo "🚀 Connecting Todo Backend to Amazon RDS"
echo "=========================================="

# Step 1: Generate IAM Auth Token
echo ""
echo "Step 1: Generating RDS IAM authentication token..."
AUTH_TOKEN=$(aws rds generate-db-auth-token \
    --hostname "$RDS_HOST" \
    --port "$RDS_PORT" \
    --username "$RDS_USER" \
    --region "$REGION" 2>&1)

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate auth token"
    echo "$AUTH_TOKEN"
    exit 1
fi
echo "✅ Auth token generated (valid for 15 minutes)"

# Step 2: Download CA Certificate
echo ""
echo "Step 2: Checking RDS CA certificate..."
CA_CERT="/tmp/rds-combined-ca-bundle.pem"
if [ ! -f "$CA_CERT" ]; then
    echo "Downloading CA certificate..."
    curl -sSL "https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem" -o "$CA_CERT"
    echo "✅ CA certificate downloaded"
else
    echo "✅ CA certificate already exists"
fi

# Step 3: Set Environment Variables
echo ""
echo "Step 3: Configuring environment..."
export NODE_ENV=production
export PORT=3000
export DATABASE_URL="postgresql://${RDS_USER}:${AUTH_TOKEN}@${RDS_HOST}:${RDS_PORT}/${RDS_DB}?sslmode=require"
export JWT_SECRET="your-super-secret-jwt-key-min-32-chars-long-for-security"
export JWT_EXPIRES_IN=15m
export BCRYPT_ROUNDS=12
export RATE_LIMIT_WINDOW_MS=900000
export RATE_LIMIT_MAX_REQUESTS=100
export LOG_LEVEL=info

echo "✅ Environment configured"
echo ""
echo "   Database: ${RDS_DB}@${RDS_HOST}"
echo "   SSL: Enabled (require)"
echo "   Port: ${PORT}"
echo ""

# Step 4: Start Server
echo "Step 4: Starting backend server..."
echo "=========================================="
echo ""
exec npm run start