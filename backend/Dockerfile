FROM golang:1.27.3-alpine3.24 AS builder

WORKDIR /src
RUN apk add --no-cache git ca-certificates

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build \
    -trimpath \
    -ldflags="-s -w" \
    -o /out/nscene-api ./cmd/api

FROM alpine:3.24.1 AS runtime

RUN apk add --no-cache ca-certificates postgresql-client \
    && addgroup -S nscene \
    && adduser -S -G nscene -H -h /nonexistent nscene

WORKDIR /app
COPY --from=builder --chown=nscene:nscene /out/nscene-api /app/nscene-api
COPY --chown=nscene:nscene migrations /app/migrations
COPY --chown=nscene:nscene scripts /app/scripts

USER nscene:nscene
EXPOSE 8080
ENTRYPOINT ["/app/nscene-api"]