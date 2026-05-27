#!/bin/bash
# ============================================
# Stop Todo Application
# ============================================

echo "🛑 Stopping Todo Application..."

BACKEND_PIDS=$(lsof -ti:3000 2>/dev/null || true)
FRONTEND_PIDS=$(lsof -ti:5173 2>/dev/null || true)

if [ -n "$BACKEND_PIDS" ]; then
    kill $BACKEND_PIDS 2>/dev/null
    echo "✅ Backend stopped"
else
    echo "ℹ️ Backend was not running"
fi

if [ -n "$FRONTEND_PIDS" ]; then
    kill $FRONTEND_PIDS 2>/dev/null
    echo "✅ Frontend stopped"
else
    echo "ℹ️ Frontend was not running"
fi

echo "Done!"