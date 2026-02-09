# HALO API Gateway - Backend Microservice

A high-performance API Gateway built with Go and Gin framework for the HALO live streaming platform. Optimized for low-memory allocation and high throughput to handle 50k+ concurrent requests.

## Architecture

### Technology Stack

- **Framework**: Gin (v1.10+) - High-performance HTTP web framework
- **Database**: PostgreSQL - User profiles and video metadata
- **Cache**: Redis - Real-time engagement counters
- **Authentication**: JWT (JSON Web Tokens)
- **Language**: Go 1.24+

### Design Principles

- **Modular Architecture**: Clean separation of concerns with layered architecture
- **High Performance**: Optimized for low-memory allocation and high concurrency
- **Scalability**: Connection pooling, rate limiting, and efficient data structures
- **Security**: JWT authentication, input validation, secure password hashing

### Directory Structure

```
backend/
├── cmd/
│   └── api/            # Main application entry point
├── internal/
│   ├── auth/           # Authentication service (login, register, JWT)
│   ├── video/          # Video metadata service
│   ├── database/       # Database clients (PostgreSQL, Redis)
│   ├── middleware/     # HTTP middleware (auth, rate limiting, logging)
│   └── models/         # Data models
├── pkg/
│   ├── config/         # Configuration management
│   └── logger/         # Logging utilities
├── migrations/         # Database migration files
├── Dockerfile          # Container image definition
├── docker-compose.yml  # Local development setup
└── .env.example        # Environment variables template
```

## Features

### User Authentication
- User registration with email/password
- Secure login with JWT tokens
- Password hashing with bcrypt
- Token-based session management
- Adult mode and age verification support

### Video Metadata
- Video metadata retrieval by ID
- List videos with pagination
- Filter by live status
- User-specific video listings
- Adult content filtering

### Real-time Engagement
- Live viewer count tracking (Redis)
- Like counter (Redis)
- Comment counter (Redis)
- Low-latency read/write operations
- Atomic counter operations

### Performance Optimizations
- Connection pooling (PostgreSQL: 100 max, 10 idle)
- Redis connection pooling (100 pool size)
- Rate limiting (1000 req/s, burst 2000)
- Gin release mode for production
- Optimized timeouts (10s read/write, 120s idle)
- Minimal memory allocations
- Efficient query indexing

## Getting Started

### Prerequisites

- Go 1.24 or higher
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   go mod download
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations**
   ```bash
   # Connect to PostgreSQL and run migrations
   psql -h localhost -U postgres -d halo -f migrations/001_init.sql
   ```

### Running with Docker Compose (Recommended)

The easiest way to run the entire stack:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- Redis cache (port 6379)
- API Gateway (port 8080)

### Running Locally

1. **Start PostgreSQL and Redis** (or use Docker Compose for just these)
   ```bash
   docker-compose up -d postgres redis
   ```

2. **Run the API server**
   ```bash
   go run cmd/api/main.go
   ```

The server will start on `http://localhost:8080`

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user profile (protected)

### Videos
- `GET /api/v1/videos` - List videos (with pagination)
- `GET /api/v1/videos/:id` - Get video by ID
- `GET /api/v1/users/:user_id/videos` - Get user's videos
- `POST /api/v1/videos/:id/engagement/:metric` - Increment engagement (protected)

### Example Requests

**Register User**
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "securepassword123",
    "display_name": "John Doe",
    "is_adult": true
  }'
```

**Login**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

**Get Videos**
```bash
curl http://localhost:8080/api/v1/videos?limit=20&offset=0&live=true
```

**Increment Engagement**
```bash
curl -X POST http://localhost:8080/api/v1/videos/1/engagement/likes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Configuration

All configuration is managed via environment variables. See `.env.example` for all available options.

### Key Configuration Options

- **SERVER_PORT**: API server port (default: 8080)
- **DB_MAX_OPEN_CONNS**: Max PostgreSQL connections (default: 100)
- **REDIS_POOL_SIZE**: Redis connection pool size (default: 100)
- **JWT_SECRET_KEY**: Secret key for JWT signing (REQUIRED)

### Performance Tuning

For 50k+ concurrent requests:
- Increase `DB_MAX_OPEN_CONNS` to 200-500
- Increase `REDIS_POOL_SIZE` to 200-500
- Adjust rate limiter: modify `NewRateLimiter(1000, 2000)` in `main.go`
- Scale horizontally with load balancer
- Use connection pooling at infrastructure level

## Database Schema

### Users Table
- Stores user profiles
- Email and username uniqueness
- Password hashing with bcrypt
- Adult mode preferences

### Videos Table
- Video metadata
- Foreign key to users
- Live status tracking
- Adult content flagging
- View count tracking

### Indexes
- Optimized for common query patterns
- Email and username lookups
- Video filtering by user, live status
- Sorted by creation date

## Security

- **Password Hashing**: bcrypt with default cost
- **JWT Tokens**: HS256 algorithm with configurable expiration
- **Rate Limiting**: Token bucket algorithm per IP
- **Input Validation**: Gin binding validation
- **CORS**: Configurable cross-origin settings
- **SQL Injection**: Prepared statements via pgx

## Testing

```bash
# Run all tests
go test ./...

# Run with coverage
go test -cover ./...

# Run specific package
go test ./internal/auth/...
```

## Building for Production

```bash
# Build optimized binary
CGO_ENABLED=0 go build -ldflags="-w -s" -o api ./cmd/api

# Build Docker image
docker build -t halo-api:latest .
```

## Monitoring & Observability

- **Health Endpoint**: `/health` provides database and Redis status
- **Request Logging**: All requests logged with latency
- **Error Logging**: Detailed error logging to stderr
- **Metrics**: Extend with Prometheus metrics as needed

## Load Testing

Example with Apache Bench:
```bash
ab -n 100000 -c 1000 http://localhost:8080/health
```

Expected performance:
- 50k+ requests per second
- Sub-10ms p95 latency for cached reads
- Sub-50ms p95 latency for database reads

## Deployment

### Docker
```bash
docker run -p 8080:8080 \
  -e DB_HOST=your-db-host \
  -e REDIS_HOST=your-redis-host \
  -e JWT_SECRET_KEY=your-secret \
  halo-api:latest
```

### Kubernetes
See deployment examples in `/deploy` directory (to be added)

## Troubleshooting

**Database connection errors**
- Verify PostgreSQL is running
- Check DB_HOST and DB_PORT
- Ensure database exists: `createdb halo`

**Redis connection errors**
- Verify Redis is running
- Check REDIS_HOST and REDIS_PORT
- Test connection: `redis-cli ping`

**High memory usage**
- Reduce connection pool sizes
- Check for connection leaks
- Monitor with `go tool pprof`

## Contributing

1. Follow Go best practices
2. Add tests for new features
3. Update documentation
4. Run `go fmt` before committing

## License

MIT License - See LICENSE file for details
