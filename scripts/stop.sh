#!/bin/bash

# Room Booking App - Docker Stop Script

echo "🛑 Stopping Room Booking App..."

# Stop all services
docker-compose -f docker/docker-compose.yml down

# Remove volumes (optional - uncomment if you want to reset database)
# echo "🗑️  Removing database volumes..."
# docker-compose -f docker/docker-compose.yml down -v

echo "✅ Room Booking App stopped successfully!"
echo ""
echo "💡 To start again: ./scripts/start.sh"
echo "🗑️  To reset database: docker-compose -f docker/docker-compose.yml down -v"
