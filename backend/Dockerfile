FROM golang:1.27.1-alpine3.24 AS builder

WORKDIR /src
RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build \
    -trimpath \
    -ldflags="-s -w" \
    -o /out/halo-api ./cmd/api

FROM alpine:3.24.1 AS runtime

RUN apk add --no-cache ca-certificates \
    && addgroup -S halo \
    && adduser -S -G halo -H -h /nonexistent halo

WORKDIR /app
COPY --from=builder --chown=halo:halo /out/halo-api /app/halo-api

USER halo:halo
EXPOSE 8080
ENTRYPOINT ["/app/halo-api"]
