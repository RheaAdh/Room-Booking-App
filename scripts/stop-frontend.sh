#!/bin/bash

# Room Booking App - Frontend Stop Script

echo "🛑 Stopping Room Booking App Frontend..."

# Find and kill Node.js processes running on port 3000
echo "🔍 Looking for frontend processes on port 3000..."

# Get the process ID running on port 3000
FRONTEND_PID=$(lsof -ti:3000)

if [ -n "$FRONTEND_PID" ]; then
    echo "📱 Found frontend process (PID: $FRONTEND_PID) running on port 3000"
    echo "🛑 Stopping frontend process..."
    kill -TERM $FRONTEND_PID
    
    # Wait a moment for graceful shutdown
    sleep 3
    
    # Check if process is still running
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "⚠️  Process still running, force killing..."
        kill -KILL $FRONTEND_PID
    fi
    
    echo "✅ Frontend stopped successfully!"
else
    echo "ℹ️  No frontend process found running on port 3000"
fi

# Also check for any React development servers
echo "🔍 Checking for any React development servers..."
REACT_PIDS=$(pgrep -f "react-scripts start")

if [ -n "$REACT_PIDS" ]; then
    echo "📱 Found React development server processes: $REACT_PIDS"
    echo "🛑 Stopping React development servers..."
    echo $REACT_PIDS | xargs kill -TERM
    sleep 2
    echo $REACT_PIDS | xargs kill -KILL 2>/dev/null
    echo "✅ React development servers stopped!"
else
    echo "ℹ️  No React development servers found"
fi

echo ""
echo "💡 To start frontend again: ./scripts/start-frontend.sh"
echo ""
