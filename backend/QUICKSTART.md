# HALO API Gateway - Quick Start Guide

Get the HALO API Gateway up and running in 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- OR Go 1.24+, PostgreSQL 15+, and Redis 7+

## Option 1: Docker Compose (Recommended)

### Step 1: Navigate to backend directory
```bash
cd backend
```

### Step 2: Start all services
```bash
docker-compose up -d
```

This command will:
- Start PostgreSQL database (port 5432)
- Start Redis cache (port 6379)
- Build and start the API Gateway (port 8080)
- Run database migrations automatically

### Step 3: Verify it's running
```bash
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": true,
  "redis": true,
  "time": 1707515000
}
```

### Step 4: Create your first user
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@example.com",
    "username": "demouser",
    "password": "securepass123",
    "display_name": "Demo User",
    "is_adult": true
  }'
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "demo@example.com",
    "username": "demouser",
    "display_name": "Demo User",
    ...
  }
}
```

### Step 5: Test authentication
```bash
# Save the token from the previous response
TOKEN="<your-token-here>"

curl http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Step 6: Stop services
```bash
docker-compose down
```

## Option 2: Local Development (Without Docker)

### Step 1: Start PostgreSQL and Redis

Using Docker for databases only:
```bash
docker-compose up -d postgres redis
```

OR install and start them manually on your system.

### Step 2: Set up environment variables
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
```

### Step 3: Run database migrations
```bash
psql -h localhost -U postgres -d halo -f migrations/001_init.sql
```

### Step 4: Install dependencies
```bash
go mod download
```

### Step 5: Build and run
```bash
# Option A: Run directly
go run ./cmd/api

# Option B: Build then run
go build -o api ./cmd/api
./api
```

### Step 6: Test the API
Follow steps 3-5 from Option 1 above.

## Using the Makefile

The backend includes a Makefile for common tasks:

```bash
# Build the application
make build

# Run the application
make run

# Run tests
make test

# Start Docker services
make docker-up

# Stop Docker services
make docker-down

# Format code
make fmt

# Lint code
make lint

# Show all commands
make help
```

## API Endpoints Overview

### Public Endpoints
- `GET /health` - Health check
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/videos` - List videos
- `GET /api/v1/videos/:id` - Get video details

### Protected Endpoints (Require JWT)
- `GET /api/v1/auth/me` - Get current user profile
- `POST /api/v1/videos/:id/engagement/:metric` - Increment engagement

## Common Tasks

### Create a user and login
```bash
# Register
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","username":"john","password":"pass12345","display_name":"John Doe","is_adult":true}'

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass12345"}'
```

### Get videos
```bash
# Get all videos
curl http://localhost:8080/api/v1/videos

# Get live videos only
curl http://localhost:8080/api/v1/videos?live=true

# Get with pagination
curl http://localhost:8080/api/v1/videos?limit=10&offset=0
```

### Increment engagement (authenticated)
```bash
# Like a video
curl -X POST http://localhost:8080/api/v1/videos/1/engagement/likes \
  -H "Authorization: Bearer YOUR_TOKEN"

# Add viewer
curl -X POST http://localhost:8080/api/v1/videos/1/engagement/live_viewers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Port already in use
```bash
# Find and kill process using port 8080
lsof -ti:8080 | xargs kill -9

# OR change the port in .env
SERVER_PORT=8081
```

### Database connection error
```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Redis connection error
```bash
# Verify Redis is running
docker-compose ps redis

# Check logs
docker-compose logs redis

# Restart Redis
docker-compose restart redis
```

### Build errors
```bash
# Clean and rebuild
go clean
rm -f api
go mod tidy
go build -o api ./cmd/api
```

## Next Steps

1. Read the [README.md](README.md) for detailed documentation
2. Read the [ARCHITECTURE.md](ARCHITECTURE.md) to understand the system design
3. Explore the API endpoints with Postman or curl
4. Check out the code in `internal/` to understand the implementation
5. Run tests with `go test ./...`

## Need Help?

- Check the logs: `docker-compose logs api`
- Verify environment variables: `cat .env`
- Test database connection: `psql -h localhost -U postgres -d halo`
- Test Redis connection: `redis-cli ping`

Enjoy building with HALO! 🎉
