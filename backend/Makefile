.PHONY: build run test clean docker-up docker-down migrate help

# Build the application
build:
	@echo "Building HALO API Gateway..."
	@go build -o api ./cmd/api
	@echo "Build complete: ./api"

# Build optimized binary for production
build-prod:
	@echo "Building optimized production binary..."
	@CGO_ENABLED=0 go build -ldflags="-w -s" -o api ./cmd/api
	@echo "Production build complete: ./api"

# Run the application
run:
	@echo "Starting HALO API Gateway..."
	@go run ./cmd/api

# Run tests
test:
	@echo "Running tests..."
	@go test -v ./...

# Run tests with coverage
test-coverage:
	@echo "Running tests with coverage..."
	@go test -cover -coverprofile=coverage.txt ./...
	@go tool cover -html=coverage.txt -o coverage.html
	@echo "Coverage report: coverage.html"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -f api
	@rm -f coverage.txt coverage.html
	@echo "Clean complete"

# Start Docker services
docker-up:
	@echo "Starting Docker services..."
	@docker-compose up -d
	@echo "Services started. API available at http://localhost:8080"

# Stop Docker services
docker-down:
	@echo "Stopping Docker services..."
	@docker-compose down
	@echo "Services stopped"

# Run database migrations
migrate:
	@echo "Running database migrations..."
	@psql -h localhost -U postgres -d halo -f migrations/001_init.sql
	@echo "Migrations complete"

# Format code
fmt:
	@echo "Formatting code..."
	@go fmt ./...
	@echo "Format complete"

# Lint code
lint:
	@echo "Linting code..."
	@go vet ./...
	@echo "Lint complete"

# Download dependencies
deps:
	@echo "Downloading dependencies..."
	@go mod download
	@go mod tidy
	@echo "Dependencies updated"

# Show help
help:
	@echo "HALO API Gateway - Makefile Commands"
	@echo ""
	@echo "  make build          - Build the application"
	@echo "  make build-prod     - Build optimized production binary"
	@echo "  make run            - Run the application"
	@echo "  make test           - Run tests"
	@echo "  make test-coverage  - Run tests with coverage report"
	@echo "  make clean          - Clean build artifacts"
	@echo "  make docker-up      - Start Docker services (DB, Redis, API)"
	@echo "  make docker-down    - Stop Docker services"
	@echo "  make migrate        - Run database migrations"
	@echo "  make fmt            - Format code"
	@echo "  make lint           - Lint code"
	@echo "  make deps           - Download and tidy dependencies"
	@echo "  make help           - Show this help message"
