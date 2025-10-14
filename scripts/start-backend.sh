#!/bin/bash

# Room Booking App - Backend Startup Script

echo "🔧 Starting Room Booking App Backend..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop any existing backend containers
echo "🛑 Stopping existing backend containers..."
docker-compose -f docker/docker-compose.yml stop backend postgres

# Build and start backend services
echo "🔨 Building and starting backend services..."
docker-compose -f docker/docker-compose.yml up --build -d postgres backend

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🔍 Checking service health..."

# Check PostgreSQL
if docker-compose -f docker/docker-compose.yml exec postgres pg_isready -U roombooking > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
fi

# Check Backend
if curl -f http://localhost:8082/api/v1/bookings > /dev/null 2>&1; then
    echo "✅ Backend API is ready"
else
    echo "❌ Backend API is not ready"
fi

echo ""
echo "🎉 Room Booking App Backend is now running!"
echo ""
echo "🔧 Backend API: http://localhost:8082/api/v1"
echo "🗄️  PostgreSQL: localhost:5433"
echo ""
echo "📱 To start the frontend: ./scripts/start-frontend.sh"
echo ""
echo "🛑 To stop backend: ./scripts/stop-backend.sh"
echo ""