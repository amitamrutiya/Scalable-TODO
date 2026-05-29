#!/bin/bash
# ============================================
# Start Todo Backend
# ============================================

set -e
cd "$(dirname "$0")"

echo "🚀 Starting Todo Backend"
echo "=========================="

# Check .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Copy .env.example and fill in values."
    exit 1
fi

# Load .env to validate DATABASE_URL is set
source .env
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL is not set in .env"
    exit 1
fi

# Check node_modules
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
fi

echo ""
echo "   API: http://localhost:${PORT:-3000}/api/v1"
echo "   ENV: ${NODE_ENV:-development}"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run dev
