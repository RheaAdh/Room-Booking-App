#!/bin/bash

# Room Booking App - Docker Startup Script

echo "🏨 Starting Room Booking App with Docker..."

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

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker/docker-compose.yml down

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker/docker-compose.yml up --build -d

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
echo "📱 To start the React web app:"
echo "   cd web-client && npm start"
echo ""
echo "📊 To view logs: docker-compose -f docker/docker-compose.yml logs -f"
echo "🛑 To stop: docker-compose -f docker/docker-compose.yml down"
echo "🔄 To restart: docker-compose -f docker/docker-compose.yml restart"
echo ""