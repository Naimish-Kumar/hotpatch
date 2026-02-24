# Build stage
FROM golang:1.22-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /hotpatch-api ./cmd/main.go

# Runtime stage
FROM alpine:3.19

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

COPY --from=builder /hotpatch-api /app/hotpatch-api
COPY --from=builder /app/migrations /app/migrations

EXPOSE 8080

ENTRYPOINT ["/app/hotpatch-api"]
