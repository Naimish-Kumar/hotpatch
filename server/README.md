# HotPatch OTA — Go Backend API

The Go backend is the central coordination layer of the HotPatch OTA system. It authenticates CLI requests, stores release metadata in PostgreSQL, manages bundle files in S3/R2 object storage, and serves the high-throughput update-check endpoint used by every app launch.

## Architecture

```
server/
├── cmd/
│   └── main.go                    # Server entry: config load, DI, start
├── internal/
│   ├── api/
│   │   ├── handlers/
│   │   │   ├── auth_handler.go    # POST /auth/token, POST /apps
│   │   │   ├── release_handler.go # POST/GET/PATCH/DELETE /releases
│   │   │   ├── update_handler.go  # GET /update/check (highest traffic)
│   │   │   └── device_handler.go  # POST /devices, POST /installations
│   │   ├── middleware/
│   │   │   ├── auth.go            # JWT validation middleware
│   │   │   └── rate_limit.go      # Per-IP rate limiting
│   │   └── routes.go              # Route registration
│   ├── services/
│   │   ├── release_service.go     # Release create, rollback, rollout
│   │   ├── update_service.go      # Update check + cohort bucketing
│   │   └── device_service.go      # Device registration + tracking
│   ├── repository/
│   │   ├── release_repo.go        # DB queries for releases
│   │   └── device_repo.go         # DB queries for devices
│   ├── models/
│   │   ├── app.go                 # App model
│   │   ├── release.go             # Release model
│   │   └── device.go              # Device + Installation models
│   ├── storage/
│   │   └── s3.go                  # S3/R2 upload, presigned URL gen
│   └── config/
│       └── config.go              # Environment config loader
├── migrations/
│   ├── 001_create_apps.sql
│   ├── 002_create_releases.sql
│   └── 003_create_devices.sql
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── go.mod
```

## Quick Start

### 1. Start infrastructure (PostgreSQL + Redis)

```bash
cd server
docker-compose up -d db redis
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Run the API server

```bash
go run ./cmd/main.go
```

The API will be available at `http://localhost:8080`.

### 4. Full Docker deployment

```bash
docker-compose up -d
```

## API Endpoints

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/token` | Exchange API key for JWT access token |
| POST | `/apps` | Register a new app (returns API key) |

### Releases (JWT Required)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/releases` | Upload new bundle (multipart/form-data) |
| GET | `/releases` | List all releases (with filters) |
| GET | `/releases/:id` | Get single release detail |
| PATCH | `/releases/:id/rollback` | Designate version as active (rollback) |
| PATCH | `/releases/:id/rollout` | Update rollout percentage |
| DELETE | `/releases/:id` | Archive (soft delete) a release |

### Update Check (High Throughput — SDK)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/update/check` | Check for updates (called on every app launch) |

### Device & Installation Reporting (SDK)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/devices` | Register device or update last_seen |
| POST | `/installations` | Report install result |
| GET | `/releases/:id/stats` | Get installation stats for a release |

## Key Design Decisions

### Stable Cohort Bucketing
Rollout percentages use FNV-1a hash of the device ID to create a stable 0-99 bucket. This ensures a device consistently receives (or doesn't receive) an update across app launches.

### Two-Tier Authentication
- **JWT tokens** for CLI/dashboard operations (release management)
- **API keys** for SDK endpoints (lightweight, high-throughput)

### Performance Targets
- `/update/check` P99 latency: < 50ms
- `/update/check` P50 latency: < 10ms
- Connection pooling: 25 max open, 10 idle

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for signing JWT tokens (min 32 chars) | Yes |
| `S3_BUCKET` | S3 or R2 bucket name | Yes |
| `S3_ENDPOINT` | Custom endpoint for Cloudflare R2 | R2 only |
| `AWS_ACCESS_KEY_ID` | S3/R2 access key | Yes |
| `AWS_SECRET_ACCESS_KEY` | S3/R2 secret key | Yes |
| `REDIS_URL` | Redis connection string | No |
| `PORT` | HTTP server port (default: 8080) | No |
| `ENVIRONMENT` | "development" or "production" | No |
