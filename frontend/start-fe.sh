#!/bin/bash
# ============================================
# Start Todo Frontend with SPA Support
# ============================================

cd "$(dirname "$0")"

echo "🚀 Starting Todo Frontend"
echo "=========================="

# Check if dist exists
if [ ! -d "dist" ]; then
    echo "📦 Building frontend..."
    npm run build
    echo "✅ Build complete"
fi

# Check if index.html exists
if [ ! -f "dist/index.html" ]; then
    echo "❌ dist/index.html not found. Running build..."
    npm run build
fi

echo "🌐 Starting SPA server on http://localhost:5173"
echo ""
echo "   URL: http://localhost:5173"
echo "   API: http://localhost:3000/api/v1"
echo ""
echo "✅ Supports React Router (no 404 on refresh)"
echo "Press Ctrl+C to stop"
echo ""

# Start Node.js server with SPA fallback support
exec node server.js