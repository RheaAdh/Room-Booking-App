# Docker Configuration

This folder contains all Docker-related files for the Room Booking App.

## Files

- **`docker-compose.yml`** - Main Docker Compose configuration
  - PostgreSQL 15 database
  - Spring Boot backend
  - Network and volume configuration

- **`Dockerfile.backend`** - Backend container configuration
  - Java 17 with Gradle
  - Spring Boot application
  - Health checks

- **`Dockerfile.frontend`** - Frontend container configuration (optional)
  - Node.js with React
  - Production build setup

- **`.dockerignore.backend`** - Backend build context exclusions
- **`.dockerignore.root`** - Root build context exclusions

## Usage

From the project root directory:

```bash
# Start services
docker-compose -f docker/docker-compose.yml up -d

# Stop services
docker-compose -f docker/docker-compose.yml down

# View logs
docker-compose -f docker/docker-compose.yml logs -f

# Or use the convenience scripts
./scripts/start.sh
./scripts/stop.sh
./scripts/logs.sh
```

## Services

- **PostgreSQL**: Port 5433 → 5432
- **Backend**: Port 8082 → 8080
- **Frontend**: Run locally with `npm start` (port 3000)
