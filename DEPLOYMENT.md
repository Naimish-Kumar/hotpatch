# HotPatch OTA Deployment & Implementation Guide

This document provides step-by-step instructions for deploying the HotPatch OTA system, including the backend, CLI, and mobile SDKs.

---

## 1. System Architecture

HotPatch consists of four primary components:
- **Backend API (Go)**: Manages releases, metadata, and update orchestration.
- **CLI Tool (Rust)**: Handles local bundle building, signing, and uploading.
- **Mobile SDK (React Native)**: Native Android/iOS implementation for update management.
- **JS Wrapper**: Cross-platform React Native interface.

---

## 2. Backend Deployment

The backend is built with Go and Gin, requiring PostgreSQL for state and Redis for caching.

### Infrastructure Prerequisites
- **PostgreSQL 14+**
- **Redis 6+**
- **S3-Compatible Storage** (AWS S3, Cloudflare R2, MinIO, etc.)

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | API listening port | `8080` |
| `DATABASE_URL` | Postgres connection string | `postgres://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret for signing auth tokens | *Secure 32+ char string* |
| `S3_BUCKET` | Storage bucket name | `hotpatch-bundles` |
| `S3_ENDPOINT` | Storage API endpoint | `https://your-account.r2.cloudflarestorage.com` |
| `S3_REGION` | Storage region | `auto` |
| `AWS_ACCESS_KEY_ID` | Storage credentials | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | Storage credentials | `...` |

### Database Migrations
Run the SQL files in `server/migrations/` in order (`001` through `006`). If using Docker, mounting the `migrations/` folder to `/docker-entrypoint-initdb.d/` will auto-run them on first boot.

### Docker Deployment
```bash
cd server
docker-compose up -d --build
```

---

## 3. CLI Setup

The `hotpatch` CLI is used by developers and CI/CD pipelines.

### Installation
```bash
cd cli
cargo install --path .
```

### Authentication
Login to your deployed backend:
```bash
hotpatch login
# Use default: http://localhost:8080 (or your server URL)
# Provide the API Key generated during App registration in the DB.
```

### Key Management
OTA updates **must** be signed for security.
```bash
# Generate a new Ed25519 keypair
hotpatch keygen --name production

# View your public key (you will need to embed this in the SDK)
hotpatch keys --show production
```

---

## 4. Mobile SDK Integration

### A. Android Integration

1. **Add Dependencies**:
   Open `android/app/build.gradle` and add:
   ```gradle
   dependencies {
       implementation 'com.squareup.okhttp3:okhttp:4.11.0'
       implementation 'net.i2p.crypto:eddsa:0.3.0'
       implementation 'org.apache.commons:commons-compress:1.24.0'
   }
   ```

2. **Modify `MainApplication.java/kt`**:
   Override the bundle path to use the OTA directory.
   ```kotlin
   // In getJSBundleFile() override
   override fun getJSBundleFile(): String? {
       return OTAUpdateManager.getBundlePath(applicationContext) ?: super.getJSBundleFile()
   }
   ```

3. **Initialize at Launch**:
   ```kotlin
   OTAUpdateManager.setup(
       url = "https://your-api.com",
       id = "your-app-id",
       channel = "production",
       signingKey = "YOUR_ED25519_PUBLIC_KEY_HEX"
   )
   ```

### B. iOS Integration

1. **Modify `AppDelegate.mm`**:
   Override the bundle URL.
   ```objectivec
   #import "OTAUpdateManager.h" // Via Bridge

   - (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
       NSURL *otaURL = [[OTAUpdateManager shared] getBundleURL];
       return otaURL ?: [super sourceURLForBridge:bridge];
   }
   ```

2. **Setup Info.plist**:
   Ensure `NSAppTransportSecurity` allows connections to your API if not using HTTPS.

3. **Initialize in `AppDelegate.mm`**:
   ```objectivec
   [[OTAUpdateManager shared] setupWithUrl:@"https://api.com" 
                                       id:@"your-app-id" 
                                  channel:@"production" 
                            signingKey:@"YOUR_PEM_PUBLIC_KEY"];
   ```

---

## 5. Deployment Workflow

### Step 1: Prepare the App
Register your app via the backend API to get an `app_id` and `X-App-Key`. Configure the SDKs with these values.

### Step 2: Create a Release
From your project root:
```bash
hotpatch release --platform android --version 1.1.0 --channel production
```
This command will:
1. Build the JS bundle.
2. Compress and Hash it.
3. Sign it with your private key.
4. Upload it to the backend.
5. Generate a binary diff patch from the previous version.

### Step 3: Rollout Control
By default, releases are created with 0% rollout. To verify:
```bash
# Get the release ID from `hotpatch status` or dashboard
hotpatch release --rollout 10 --id <id>
```
Test with a bucket of devices. If stable, increase to 100%.

### Step 4: Mandatory Updates
If a release fixes a critical crash:
```bash
# Deploy immediately to all users and force reload
hotpatch release --mandatory --rollout 100 ...
```

---

## 6. Security Hardening

### Certificate Pinning
To prevent MitM attacks, always configure pinning:
```kotlin
// Android
OTAUpdateManager.setupCertificatePinning("api.yoursite.com", "sha256/hash_here")
```

### Encryption
For sensitive proprietary code, encrypt your bundles:
```bash
hotpatch release --encrypt ...
```
Ensure the `encryptionKey` is securely shared with the SDK during initialization.

---

## 7. Troubleshooting

- **Signature Failed**: Verify the public key hex/PEM embedded in the app matches the one used by the CLI.
- **Diff Patch Failure**: Ensure the base bundle exists on the device. Differential patches require the device to have the `base_version` already installed.
- **Rollback loop**: If your JS code crashes within 10 seconds of startup 2 times in a row, the SDK will automatically revert to the factory bundle.
