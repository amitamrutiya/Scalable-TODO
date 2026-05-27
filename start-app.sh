#!/bin/bash
# ============================================
# Start Todo Application (Non-blocking)
# ============================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting Todo Application..."
echo ""

# Kill existing processes
kill $(lsof -ti:3000 2>/dev/null) 2>/dev/null || true
kill $(lsof -ti:5173 2>/dev/null) 2>/dev/null || true
sleep 2

# Start Backend
echo "📡 Starting Backend..."
cd "$PROJECT_ROOT/backend"
if [ ! -f "dist/index.js" ]; then
    echo "  Building backend..."
    npm run build
fi
./start-rds.sh > "$PROJECT_ROOT/backend.log" 2>&1 &
echo "  Backend PID: $!"

# Wait for backend
sleep 12

# Start Frontend
echo "🎨 Starting Frontend..."
cd "$PROJECT_ROOT/frontend"
if [ ! -d "dist" ]; then
    echo "  Building frontend..."
    npm run build
fi
./start-fe.sh > "$PROJECT_ROOT/frontend.log" 2>&1 &
echo "  Frontend PID: $!"

# Wait for frontend
sleep 8

echo ""
echo "✅ Servers started!"
echo ""
echo "Backend:  http://localhost:3000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Logs:"
echo "  Backend:  tail -f $PROJECT_ROOT/backend.log"
echo "  Frontend: tail -f $PROJECT_ROOT/frontend.log"
echo ""
echo "To stop: ./stop-app.sh"