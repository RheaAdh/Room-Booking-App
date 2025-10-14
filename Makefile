# Room Booking App - Makefile
# Simple commands to manage the application

.PHONY: help frontend backend stop-frontend stop-backend start stop status

# Default target
help:
	@echo "🏨 Room Booking App - Available Commands"
	@echo ""
	@echo "🚀 Start Services:"
	@echo "  make frontend        - Start frontend (React app on host - requires Node.js)"
	@echo "  make frontend-docker - Start frontend (React app in Docker - no Node.js needed)"
	@echo "  make backend         - Start backend (PostgreSQL + Spring Boot)"
	@echo "  make start           - Start both frontend and backend"
	@echo ""
	@echo "🛑 Stop Services:"
	@echo "  make stop-frontend - Stop frontend"
	@echo "  make stop-backend  - Stop backend"
	@echo "  make stop          - Stop both services"
	@echo ""
	@echo "📊 Status:"
	@echo "  make status       - Check service status"
	@echo ""
	@echo "🚀 Deployment:"
	@echo "  make deploy-heroku        - Deploy backend to Heroku (PostgreSQL)"
	@echo "  make deploy-heroku-pg     - Deploy backend to Heroku (PostgreSQL)"
	@echo "  make deploy-render        - Deploy backend to Render (PostgreSQL)"
	@echo "  make build-backend        - Build backend for deployment"
	@echo "  make setup-db-pg          - Setup PostgreSQL database schema"
	@echo "  make setup-local-pg       - Setup local PostgreSQL database"
	@echo ""

# Start frontend (host)
frontend:
	@echo "🌐 Starting frontend (host)..."
	@./scripts/start-frontend.sh

# Start frontend (Docker)
frontend-docker:
	@echo "🐳 Starting frontend (Docker)..."
	@docker-compose -f docker/docker-compose.yml up --build frontend

# Start backend
backend:
	@echo "🔧 Starting backend..."
	@./scripts/start-backend.sh

# Start both services
start: backend frontend

# Stop frontend
stop-frontend:
	@echo "🛑 Stopping frontend..."
	@./scripts/stop-frontend.sh

# Stop backend
stop-backend:
	@echo "🛑 Stopping backend..."
	@./scripts/stop-backend.sh

# Stop both services
stop: stop-frontend stop-backend

# Check service status
status:
	@echo "📊 Checking service status..."
	@echo ""
	@echo "🐳 Docker containers:"
	@docker-compose -f docker/docker-compose.yml ps 2>/dev/null || echo "No Docker containers running"
	@echo ""
	@echo "🔧 Backend API health:"
	@if curl -f http://localhost:8082/api/v1/bookings > /dev/null 2>&1; then \
		echo "✅ Backend API is running"; \
	else \
		echo "❌ Backend API is not running"; \
	fi
	@echo ""
	@echo "🌐 Frontend status:"
	@if curl -f http://localhost:3000 > /dev/null 2>&1; then \
		echo "✅ Frontend is running"; \
	else \
		echo "❌ Frontend is not running"; \
	fi

# Build backend for deployment
build-backend:
	@echo "🔨 Building backend for deployment..."
	@cd server && ./mvnw clean package -DskipTests
	@echo "✅ Backend built successfully"

# Deploy to Heroku (PostgreSQL)
deploy-heroku:
	@echo "🚀 Deploying to Heroku with PostgreSQL..."
	@echo "⚠️  Make sure you have:"
	@echo "   1. Heroku CLI installed"
	@echo "   2. Logged in with 'heroku login'"
	@echo "   3. Created app with 'heroku create your-app-name'"
	@echo "   4. Added PostgreSQL addon: 'heroku addons:create heroku-postgresql:mini'"
	@echo ""
	@read -p "Press Enter to continue or Ctrl+C to cancel..."
	@git add .
	@git commit -m "Deploy to Heroku with PostgreSQL" || echo "No changes to commit"
	@git push heroku main
	@echo "✅ Deployment initiated. Check logs with: heroku logs --tail"

# Deploy to Heroku (PostgreSQL)
deploy-heroku-pg:
	@echo "🐘 Deploying to Heroku with PostgreSQL..."
	@echo "⚠️  Make sure you have:"
	@echo "   1. Heroku CLI installed"
	@echo "   2. Logged in with 'heroku login'"
	@echo "   3. Created app with 'heroku create your-app-name'"
	@echo "   4. Added PostgreSQL addon: 'heroku addons:create heroku-postgresql:mini'"
	@echo "   5. Set production profile: 'heroku config:set SPRING_PROFILES_ACTIVE=prod'"
	@echo ""
	@read -p "Press Enter to continue or Ctrl+C to cancel..."
	@git add .
	@git commit -m "Deploy to Heroku with PostgreSQL" || echo "No changes to commit"
	@git push heroku main
	@echo "✅ Deployment initiated. Check logs with: heroku logs --tail"
	@echo "📋 Next steps:"
	@echo "   1. Run 'make setup-db-pg' to initialize database schema"
	@echo "   2. Update CORS_ORIGINS with your Vercel URL"

# Setup PostgreSQL database schema
setup-db-pg:
	@echo "🐘 Setting up PostgreSQL database schema..."
	@echo "⚠️  This will run the PostgreSQL schema script on your Heroku database"
	@read -p "Press Enter to continue or Ctrl+C to cancel..."
	@heroku pg:psql < docker/init/complete_database_setup_postgresql.sql
	@echo "✅ Database schema setup complete!"

# Setup local PostgreSQL database
setup-local-pg:
	@echo "🐘 Setting up local PostgreSQL database..."
	@./scripts/setup-local-postgres.sh

# Deploy to Render (PostgreSQL)
deploy-render:
	@echo "🚀 Deploying to Render with PostgreSQL..."
	@echo "📋 Prerequisites:"
	@echo "   1. Create PostgreSQL database on Render"
	@echo "   2. Create Web Service on Render"
	@echo "   3. Set environment variables in Render dashboard"
	@echo "   4. Run database setup script"
	@echo ""
	@echo "📖 See RENDER_DEPLOYMENT.md for detailed instructions"
	@echo "🔗 Render Dashboard: https://dashboard.render.com/"
