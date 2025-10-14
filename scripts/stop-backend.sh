#!/bin/bash

# Room Booking App - Backend Stop Script

echo "🛑 Stopping Room Booking App Backend..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Cannot stop backend services."
    exit 1
fi

# Stop backend services
echo "🛑 Stopping backend services..."
docker-compose -f docker/docker-compose.yml stop backend postgres

# Check if services were stopped
echo "🔍 Checking service status..."

# Check if PostgreSQL container is stopped
if docker-compose -f docker/docker-compose.yml ps postgres | grep -q "Exited"; then
    echo "✅ PostgreSQL container stopped"
else
    echo "⚠️  PostgreSQL container may still be running"
fi

# Check if Backend container is stopped
if docker-compose -f docker/docker-compose.yml ps backend | grep -q "Exited"; then
    echo "✅ Backend container stopped"
else
    echo "⚠️  Backend container may still be running"
fi

# Check if API is no longer responding
if curl -f http://localhost:8082/api/v1/customers > /dev/null 2>&1; then
    echo "⚠️  Backend API is still responding"
else
    echo "✅ Backend API is no longer responding"
fi

echo ""
echo "✅ Room Booking App Backend stopped successfully!"
echo ""
echo "💡 To start backend again: ./scripts/start-backend.sh"
echo "💡 To completely remove containers: docker-compose -f docker/docker-compose.yml down"
echo ""
