#!/bin/bash
# ============================================
# Start Todo Frontend
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

# Start http-server
echo "🌐 Serving frontend on http://localhost:5173"
echo ""
echo "   URL: http://localhost:5173"
echo "   API: http://localhost:3000/api/v1"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Use npx to run http-server without global install
exec npx http-server dist -p 5173 --cors