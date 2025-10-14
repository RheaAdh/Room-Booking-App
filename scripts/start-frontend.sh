#!/bin/bash

# Room Booking App - Frontend Startup Script

echo "🌐 Starting Room Booking App Frontend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Navigate to web-client directory
cd web-client

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if backend is running
echo "🔍 Checking if backend is running..."
if curl -f http://localhost:8082/api/v1/customers > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "⚠️  Backend is not running. Please start the backend first:"
    echo "   ./scripts/start-backend.sh"
    echo ""
    echo "🔄 Starting frontend anyway..."
fi

# Start the development server
echo "🚀 Starting React development server..."
echo ""
echo "🌐 Frontend will be available at: http://localhost:3000"
echo "📱 Press Ctrl+C to stop the server"
echo ""

npm start