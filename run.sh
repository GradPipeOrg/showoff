#!/bin/bash

# ============================================
# SHOWOFF - Development Runner
# ============================================
# This script runs both backend and frontend
# Press Ctrl+C to stop everything and cleanup
# ============================================

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Store PIDs for cleanup
BACKEND_PID=""
CELERY_PID=""
FRONTEND_PID=""

# Function to print colored messages
print_message() {
    echo -e "${2}${1}${NC}"
}

# Cleanup function - kills all processes
cleanup() {
    print_message "\n🛑 Shutting down all services..." "$YELLOW"
    
    # Kill frontend
    if [ ! -z "$FRONTEND_PID" ]; then
        print_message "Stopping frontend (PID: $FRONTEND_PID)..." "$BLUE"
        kill -TERM $FRONTEND_PID 2>/dev/null || true
        wait $FRONTEND_PID 2>/dev/null || true
    fi
    
    # Kill backend
    if [ ! -z "$BACKEND_PID" ]; then
        print_message "Stopping backend API (PID: $BACKEND_PID)..." "$BLUE"
        kill -TERM $BACKEND_PID 2>/dev/null || true
        wait $BACKEND_PID 2>/dev/null || true
    fi
    
    # Kill Celery worker
    if [ ! -z "$CELERY_PID" ]; then
        print_message "Stopping Celery worker (PID: $CELERY_PID)..." "$BLUE"
        kill -TERM $CELERY_PID 2>/dev/null || true
        wait $CELERY_PID 2>/dev/null || true
    fi
    
    # Kill any remaining child processes
    pkill -P $$ 2>/dev/null || true
    
    print_message "✅ All services stopped successfully!" "$GREEN"
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup SIGINT SIGTERM EXIT

# Check if .env exists
if [ ! -f ".env" ]; then
    print_message "❌ ERROR: .env file not found!" "$RED"
    print_message "Please create .env file from .env.example:" "$YELLOW"
    print_message "  cp .env.example .env" "$YELLOW"
    print_message "  Then edit .env and add your keys" "$YELLOW"
    exit 1
fi

# Check if virtual environment is activated
if [ -z "$VIRTUAL_ENV" ]; then
    print_message "⚠️  WARNING: No virtual environment detected!" "$YELLOW"
    print_message "It's recommended to activate your virtual environment first:" "$YELLOW"
    print_message "  source ../../../fast/bin/activate" "$YELLOW"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

print_message "🚀 Starting Showoff Development Environment..." "$GREEN"
echo ""

# ============================================
# START BACKEND SERVICES
# ============================================

print_message "📦 Starting Backend Services..." "$BLUE"

# Start Celery Worker
cd backend
print_message "Starting Celery worker..." "$BLUE"
celery -A worker.celery_app worker --loglevel=info -P gevent > ../celery.log 2>&1 &
CELERY_PID=$!
print_message "✓ Celery worker started (PID: $CELERY_PID)" "$GREEN"
sleep 2

# Start Backend API
print_message "Starting Backend API..." "$BLUE"
uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --reload > ../backend.log 2>&1 &
BACKEND_PID=$!
print_message "✓ Backend API started (PID: $BACKEND_PID)" "$GREEN"
sleep 2

cd ..

# ============================================
# START FRONTEND
# ============================================

print_message "📦 Starting Frontend..." "$BLUE"
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_message "Installing frontend dependencies..." "$YELLOW"
    npm install --legacy-peer-deps
fi

npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
print_message "✓ Frontend started (PID: $FRONTEND_PID)" "$GREEN"
cd ..

echo ""
print_message "========================================" "$GREEN"
print_message "✅ ALL SERVICES RUNNING!" "$GREEN"
print_message "========================================" "$GREEN"
print_message "Backend API:      http://localhost:${PORT:-8000}" "$BLUE"
print_message "Frontend:         http://localhost:5173" "$BLUE"
print_message "========================================" "$GREEN"
print_message "Logs:" "$YELLOW"
print_message "  Backend:  tail -f backend.log" "$YELLOW"
print_message "  Celery:   tail -f celery.log" "$YELLOW"
print_message "  Frontend: tail -f frontend.log" "$YELLOW"
print_message "========================================" "$GREEN"
print_message "Press Ctrl+C to stop all services" "$YELLOW"
echo ""

# Wait for all background jobs
wait
