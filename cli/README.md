# HotPatch CLI

The Rust-based CLI tool for building, signing, and publishing OTA updates to React Native apps.

## Architecture

```
cli/
├── src/
│   ├── main.rs                  # Entry point, Clap command dispatch
│   ├── commands/
│   │   ├── mod.rs
│   │   ├── login.rs             # hotpatch login — store API token
│   │   ├── release.rs           # hotpatch release — full publish pipeline
│   │   ├── rollback.rs          # hotpatch rollback — revert a version
│   │   ├── keygen.rs            # hotpatch keygen — Ed25519 keypair
│   │   └── status.rs            # hotpatch status — show config & auth
│   ├── bundle/
│   │   ├── mod.rs
│   │   ├── builder.rs           # Shell: npx react-native bundle
│   │   └── compressor.rs        # ZIP creation (deflate level 9)
│   ├── api/
│   │   └── mod.rs               # HTTP client, auth, multipart upload
│   ├── config/
│   │   └── mod.rs               # Read/write ~/.hotpatch/config.toml
│   ├── signing/
│   │   └── mod.rs               # Ed25519 key generation + file signing
│   └── utils/
│       └── mod.rs               # SHA256 file hashing
└── Cargo.toml
```

## Installation

### From source (requires Rust)

```bash
cd cli
cargo build --release
# Binary at target/release/hotpatch (or hotpatch.exe on Windows)
```

### Add to PATH

```bash
# Linux/macOS
cp target/release/hotpatch /usr/local/bin/

# Windows — add to PATH or use directly
```

## Quick Start

### 1. Generate signing keys

```bash
hotpatch keygen
```

This generates an Ed25519 keypair at `~/.hotpatch/`:
- `signing_key.pem` — Private key (keep secret!)
- `public_key.pem` — Embed in your React Native app

### 2. Log in

```bash
hotpatch login
```

Enter your API endpoint and API key. The CLI exchanges this for a JWT token.

### 3. Publish a release

```bash
hotpatch release \
  --platform android \
  --version 1.2.0 \
  --channel production \
  --rollout 10
```

This runs the full publish pipeline:
1. **Build** — `npx react-native bundle` (JS compilation)
2. **Compress** — ZIP with max deflate compression
3. **Hash** — SHA256 of the compressed bundle
4. **Sign** — Ed25519 signature using your private key
5. **Upload** — Multipart upload to HotPatch backend

### 4. Rollback

```bash
hotpatch rollback \
  --platform android \
  --version 1.1.5 \
  --channel production
```

### 5. Check status

```bash
hotpatch status
```

## Commands

### `hotpatch login`
Interactive login flow. Prompts for API endpoint and API key.

### `hotpatch release`
| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--platform` | Yes | — | `android` or `ios` |
| `--version` | Yes | — | Semver version string |
| `--channel` | No | `production` | Release channel |
| `--mandatory` | No | `false` | Force immediate update |
| `--rollout` | No | `100` | Rollout percentage (1-100) |
| `--entry-file` | No | `index.js` | JS entry point |
| `--build-dir` | No | `./build` | Build output directory |

### `hotpatch rollback`
| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--platform` | Yes | — | `android` or `ios` |
| `--version` | Yes | — | Version to roll back to |
| `--channel` | No | `production` | Release channel |

### `hotpatch keygen`
| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--force` | No | `false` | Overwrite existing keys |

### `hotpatch status`
No arguments. Shows auth state, token info, and signing key status.

## Security Model

- **Ed25519 signatures** ensure bundles haven't been tampered with
- **SHA256 hashes** provide integrity verification
- **JWT tokens** authenticate CLI operations
- Private keys never leave the developer's machine
- The public key is embedded in the app for verification

## Configuration

All config is stored at `~/.hotpatch/`:

| File | Purpose |
|------|---------|
| `config.toml` | API endpoint, JWT token, app ID |
| `signing_key.pem` | Ed25519 private key (base64) |
| `public_key.pem` | Ed25519 public key (base64) |
