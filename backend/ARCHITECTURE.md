# HALO API Gateway Architecture

## Overview

The HALO API Gateway is a high-performance microservice built with Go and the Gin framework. It serves as the central entry point for client applications, handling authentication, video metadata retrieval, and real-time engagement tracking.

## Design Goals

1. **High Performance**: Handle 50,000+ concurrent requests
2. **Low Latency**: Sub-10ms response times for cached reads
3. **Memory Efficient**: Minimal memory allocations through careful design
4. **Scalable**: Horizontal scaling with stateless design
5. **Secure**: JWT authentication, rate limiting, input validation

## Architecture Layers

### 1. HTTP Layer (Gin Framework)
- **Router**: Gin's high-performance HTTP router
- **Middleware Pipeline**:
  - Recovery (panic recovery)
  - Logger (request/response logging)
  - CORS (cross-origin resource sharing)
  - Rate Limiter (token bucket algorithm)
  - Auth (JWT validation for protected routes)

### 2. Handler Layer
- **Auth Handler**: User registration, login, profile retrieval
- **Video Handler**: Video metadata retrieval, engagement tracking
- Responsible for:
  - Request validation
  - Response formatting
  - HTTP status codes
  - Error handling

### 3. Service Layer (Business Logic)
- **Auth Service**: User authentication logic
  - Password hashing (bcrypt)
  - User registration validation
  - Login credential verification
- **Video Service**: Video metadata and engagement logic
  - Video retrieval and filtering
  - Engagement data enrichment from Redis
  - Business rule enforcement

### 4. Repository Layer (Data Access)
- **Auth Repository**: PostgreSQL user data access
  - CRUD operations for users
  - Query optimization
- **Video Repository**: PostgreSQL video metadata access
  - CRUD operations for videos
  - Pagination support
  - Filtering and sorting

### 5. Database Layer
- **PostgreSQL**: Persistent storage
  - User profiles
  - Video metadata
  - Relational data
- **Redis**: In-memory cache
  - Real-time engagement counters
  - Live viewer counts
  - Like/comment counts

## Data Flow

### Authentication Flow
```
Client Request
    ↓
Gin Router
    ↓
CORS Middleware → Rate Limiter → Logger
    ↓
Auth Handler (validate input)
    ↓
Auth Service (business logic)
    ↓
Auth Repository (database query)
    ↓
PostgreSQL
    ↓
JWT Manager (generate token)
    ↓
Response to Client
```

### Protected Endpoint Flow
```
Client Request (with JWT)
    ↓
Gin Router
    ↓
CORS → Rate Limiter → Logger → Auth Middleware
    ↓
JWT Validation
    ↓
Handler (user_id from context)
    ↓
Service Layer
    ↓
Response to Client
```

### Video Retrieval Flow
```
Client Request
    ↓
Video Handler
    ↓
Video Service
    ↓
[Parallel Execution]
    ├─→ Video Repository → PostgreSQL (metadata)
    └─→ Redis Client → Redis (engagement data)
    ↓
Merge Results
    ↓
VideoWithEngagement Response
```

## Performance Optimizations

### Connection Pooling
- **PostgreSQL**:
  - Max Open Connections: 100 (configurable)
  - Max Idle Connections: 10
  - Connection Max Lifetime: 3600s
- **Redis**:
  - Pool Size: 100 (configurable)
  - Min Idle Connections: 10

### Rate Limiting
- Token bucket algorithm
- 1000 requests/second per IP
- Burst capacity: 2000 requests
- Automatic cleanup of old limiters

### Memory Efficiency
- Gin release mode (reduces allocations)
- Efficient JSON encoding (Gin's optimized JSON)
- Connection reuse (HTTP keep-alive)
- Minimal middleware stack

### Caching Strategy
- Redis for real-time data (engagement counters)
- PostgreSQL for persistent data
- No application-level caching (Redis is the cache)

## Security Features

### Authentication
- **JWT Tokens**: HS256 algorithm
- **Password Hashing**: bcrypt with default cost (10)
- **Token Expiration**: Configurable (default 24 hours)
- **Bearer Token**: Standard HTTP Authorization header

### Input Validation
- Gin binding validation
- Email format validation
- Password strength requirements (min 8 characters)
- Username length validation (3-30 characters)

### Rate Limiting
- Per-IP rate limiting
- Prevents brute force attacks
- Prevents DDoS attacks
- Configurable limits

### SQL Injection Prevention
- Prepared statements (pgx driver)
- Parameterized queries
- No string concatenation in queries

## Scalability

### Horizontal Scaling
- Stateless design (JWT tokens)
- No session storage
- Load balancer compatible
- Multiple instances can run concurrently

### Database Scaling
- Connection pooling
- Read replicas (PostgreSQL)
- Redis cluster support (future)
- Database sharding (future)

### Vertical Scaling
- Increase connection pool sizes
- Increase rate limiter capacity
- Add more CPU cores (Go runtime scales automatically)

## Configuration Management

All configuration via environment variables:
- **Server**: Port, timeouts
- **Database**: Host, port, credentials, pool sizes
- **Redis**: Host, port, pool sizes
- **JWT**: Secret key, expiration

Benefits:
- 12-factor app compliance
- Easy deployment across environments
- No code changes for different environments
- Secure credential management

## Monitoring & Observability

### Health Check Endpoint
- `/health`: Returns database and Redis status
- Used by load balancers and orchestrators
- Quick response (2s timeout per service)

### Logging
- Structured logging (custom logger)
- Request/response logging
- Error logging with stack traces
- Configurable log levels

### Metrics (Future)
- Prometheus metrics
- Request counts, latencies
- Error rates
- Database connection pool metrics

## API Design

### RESTful Principles
- Resource-based URLs
- HTTP methods (GET, POST, PUT, DELETE)
- Standard HTTP status codes
- JSON request/response format

### Versioning
- URL versioning (`/api/v1/...`)
- Easy to add new versions
- Backward compatibility

### Error Handling
- Consistent error response format
- Error codes and messages
- HTTP status codes
- Validation error details

## Deployment Architecture

### Docker Container
- Multi-stage build (builder + runtime)
- Alpine Linux base (minimal size)
- No CGO (static binary)
- Optimized for production

### Docker Compose (Development)
- PostgreSQL container
- Redis container
- API container
- Automatic migrations
- Health checks

### Production Deployment
- Kubernetes (recommended)
- Docker Swarm (alternative)
- Cloud platforms (AWS, GCP, Azure)
- Load balancer + multiple instances

## Future Enhancements

### Performance
- [ ] Redis cluster support
- [ ] PostgreSQL read replicas
- [ ] Response compression (gzip)
- [ ] HTTP/2 support

### Features
- [ ] WebSocket support for real-time updates
- [ ] GraphQL API
- [ ] Admin API endpoints
- [ ] Content moderation integration

### Observability
- [ ] Prometheus metrics
- [ ] Grafana dashboards
- [ ] Distributed tracing (Jaeger)
- [ ] Log aggregation (ELK stack)

### Security
- [ ] OAuth2 support
- [ ] Two-factor authentication
- [ ] API key authentication
- [ ] IP whitelisting

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | Go | 1.24+ |
| Framework | Gin | 1.11+ |
| Database | PostgreSQL | 15+ |
| Cache | Redis | 7+ |
| Auth | JWT | - |
| Password | bcrypt | - |
| Container | Docker | 20+ |
| Orchestration | Docker Compose / Kubernetes | - |

## Performance Benchmarks

Expected performance (single instance, 8 CPU cores):
- **Throughput**: 50,000+ req/s
- **Latency (p50)**: < 5ms
- **Latency (p95)**: < 10ms (cached)
- **Latency (p95)**: < 50ms (database)
- **Memory**: < 100MB baseline
- **Concurrent Connections**: 10,000+

## Conclusion

The HALO API Gateway is designed for high performance, scalability, and security. Its modular architecture makes it easy to maintain and extend, while careful performance optimizations ensure it can handle production workloads of 50k+ concurrent requests.
