#!/bin/bash
# Start Backend with RDS IAM Authentication
# Usage: ./start-with-rds.sh [environment]
# Environments: dev (default), prod

set -e

ENV=${1:-dev}
RDS_HOST="database-2.cluster-c4v8260a8z2i.us-east-1.rds.amazonaws.com"
RDS_PORT="5432"
RDS_DB="todoapp"
RDS_USER="postgres"
REGION="us-east-1"

echo "🚀 Starting Todo Backend with RDS (${ENV})..."
echo "   Host: $RDS_HOST"
echo "   Database: $RDS_DB"
echo "   Region: $REGION"

# Verify AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI is not installed"
    echo "   Install from: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Generate IAM auth token
echo "🔑 Generating RDS IAM authentication token..."
AUTH_TOKEN=$(aws rds generate-db-auth-token \
    --hostname "$RDS_HOST" \
    --port "$RDS_PORT" \
    --username "$RDS_USER" \
    --region "$REGION" 2>&1)

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate auth token:"
    echo "   $AUTH_TOKEN"
    echo ""
    echo "💡 Troubleshooting:"
    echo "   1. Ensure AWS credentials are configured: aws configure"
    echo "   2. Verify IAM permissions for rds-db:connect"
    echo "   3. Check region is correct"
    exit 1
fi

echo "✅ Auth token generated successfully"

# Export environment variables
export NODE_ENV=${ENV}
export PORT=${PORT:-3000}
export DATABASE_URL="postgresql://${RDS_USER}:${AUTH_TOKEN}@${RDS_HOST}:${RDS_PORT}/${RDS_DB}?sslmode=require&sslrootcert=/tmp/rds-combined-ca-bundle.pem"
export JWT_SECRET=${JWT_SECRET:-$(openssl rand -base64 48)}
export JWT_EXPIRES_IN="15m"
export BCRYPT_ROUNDS="12"
export RATE_LIMIT_WINDOW_MS="900000"
export RATE_LIMIT_MAX_REQUESTS="100"
export LOG_LEVEL="info"

# Download RDS CA certificate if not present
if [ ! -f "/tmp/rds-combined-ca-bundle.pem" ]; then
    echo "📜 Downloading RDS CA certificate..."
    curl -sSL "https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem" \
        -o /tmp/rds-combined-ca-bundle.pem
    echo "✅ CA certificate downloaded"
else
    echo "✅ CA certificate already exists"
fi

echo ""
echo "🔧 Environment configured:"
echo "   NODE_ENV=$NODE_ENV"
echo "   PORT=$PORT"
echo "   DATABASE_URL=postgresql://***:***@${RDS_HOST}:${RDS_PORT}/${RDS_DB}?sslmode=require"
echo ""

# Initialize database schema if requested
if [ "${INIT_DB:-false}" = "true" ]; then
    echo "📊 Initializing database schema..."
    npx ts-node src/scripts/init-rds.ts
fi

echo "🚀 Starting server..."
echo ""

# Start the server
npm run start