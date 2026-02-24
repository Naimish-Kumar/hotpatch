use anyhow::{Context, Result};
use reqwest::multipart;
use serde::{Deserialize, Serialize};
use std::path::Path;

/// HTTP client for communicating with the HotPatch backend API.
pub struct ApiClient {
    client: reqwest::Client,
    base_url: String,
    token: String,
}

// ── Response types ──

#[derive(Debug, Deserialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub token_type: String,
    pub expires_in: u64,
}

#[derive(Debug, Deserialize)]
pub struct ReleaseResponse {
    pub id: String,
    pub version: String,
    pub channel: String,
    pub bundle_url: String,
    pub rollout_percentage: u8,
    pub is_active: bool,
    pub is_encrypted: bool,
    pub key_id: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct RollbackResponse {
    pub message: String,
    pub release: ReleaseResponse,
}

#[derive(Debug, Serialize)]
pub struct ReleaseMetadata {
    pub version: String,
    pub channel: String,
    pub platform: String,
    pub mandatory: bool,
    pub rollout_percentage: u8,
    pub hash: String,
    pub signature: String,
    pub is_encrypted: bool,
    pub is_patch: bool,
    pub base_version: Option<String>,
    pub key_id: Option<String>,
    pub size: u64,
}

#[derive(Debug, Deserialize)]
pub struct ErrorResponse {
    pub error: String,
}

impl ApiClient {
    /// Create a new API client with the given base URL and API token.
    pub fn new(base_url: &str, token: &str) -> Self {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(120))
            .build()
            .expect("Failed to build HTTP client");

        Self {
            client,
            base_url: base_url.trim_end_matches('/').to_string(),
            token: token.to_string(),
        }
    }

    /// Exchange an API key for a JWT access token.
    /// POST /auth/token
    pub async fn authenticate(&self, api_key: &str) -> Result<TokenResponse> {
        let url = format!("{}/auth/token", self.base_url);
        let resp = self
            .client
            .post(&url)
            .json(&serde_json::json!({ "api_key": api_key }))
            .send()
            .await
            .context("Failed to connect to HotPatch API")?;

        if !resp.status().is_success() {
            let err: ErrorResponse = resp.json().await.unwrap_or(ErrorResponse {
                error: "Unknown error".to_string(),
            });
            anyhow::bail!("Authentication failed: {}", err.error);
        }

        resp.json::<TokenResponse>()
            .await
            .context("Failed to parse auth response")
    }

    /// Upload a new release bundle.
    /// POST /releases (multipart/form-data)
    pub async fn upload_release(
        &self,
        metadata: &ReleaseMetadata,
        bundle_path: &Path,
    ) -> Result<ReleaseResponse> {
        let url = format!("{}/releases", self.base_url);

        // Read bundle file
        let bundle_bytes = tokio::fs::read(bundle_path)
            .await
            .with_context(|| format!("Failed to read bundle at {}", bundle_path.display()))?;

        let file_name = bundle_path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        // Build multipart form
        let metadata_json = serde_json::to_string(metadata)
            .context("Failed to serialize release metadata")?;

        let form = multipart::Form::new()
            .text("metadata", metadata_json)
            .part(
                "bundle",
                multipart::Part::bytes(bundle_bytes)
                    .file_name(file_name)
                    .mime_str("application/zip")?,
            );

        let resp = self
            .client
            .post(&url)
            .bearer_auth(&self.token)
            .multipart(form)
            .send()
            .await
            .context("Failed to upload release")?;

        if resp.status().as_u16() == 409 {
            anyhow::bail!(
                "Version {} already exists for channel {}. Use a new version number.",
                metadata.version,
                metadata.channel
            );
        }

        if !resp.status().is_success() {
            let status = resp.status();
            let err: ErrorResponse = resp.json().await.unwrap_or(ErrorResponse {
                error: format!("HTTP {}", status),
            });
            anyhow::bail!("Upload failed ({}): {}", status, err.error);
        }

        resp.json::<ReleaseResponse>()
            .await
            .context("Failed to parse release response")
    }

    /// Rollback to a specific release.
    /// PATCH /releases/:id/rollback
    pub async fn rollback(&self, release_id: &str) -> Result<RollbackResponse> {
        let url = format!("{}/releases/{}/rollback", self.base_url, release_id);

        let resp = self
            .client
            .patch(&url)
            .bearer_auth(&self.token)
            .send()
            .await
            .context("Failed to send rollback request")?;

        if !resp.status().is_success() {
            let err: ErrorResponse = resp.json().await.unwrap_or(ErrorResponse {
                error: "Unknown error".to_string(),
            });
            anyhow::bail!("Rollback failed: {}", err.error);
        }

        resp.json::<RollbackResponse>()
            .await
            .context("Failed to parse rollback response")
    }

    /// List releases for the authenticated app.
    /// GET /releases?channel=...
    pub async fn list_releases(&self, channel: &str) -> Result<Vec<ReleaseResponse>> {
        let url = format!("{}/releases?channel={}", self.base_url, channel);

        let resp = self
            .client
            .get(&url)
            .bearer_auth(&self.token)
            .send()
            .await
            .context("Failed to fetch releases")?;

        if !resp.status().is_success() {
            let err: ErrorResponse = resp.json().await.unwrap_or(ErrorResponse {
                error: "Unknown error".to_string(),
            });
            anyhow::bail!("Failed to list releases: {}", err.error);
        }

        #[derive(Deserialize)]
        struct ListResponse {
            releases: Vec<ReleaseResponse>,
        }

        let list: ListResponse = resp.json().await.context("Failed to parse releases")?;
        Ok(list.releases)
    }

    /// Download a bundle from a URL.
    pub async fn download_bundle(&self, url: &str, dest_path: &Path) -> Result<()> {
        let resp = self
            .client
            .get(url)
            .send()
            .await
            .context("Failed to download bundle")?;

        if !resp.status().is_success() {
            anyhow::bail!("Failed to download bundle: HTTP {}", resp.status());
        }

        let bytes = resp.bytes().await.context("Failed to read download stream")?;
        tokio::fs::write(dest_path, bytes)
            .await
            .context("Failed to save downloaded bundle")?;

        Ok(())
    }

    /// Upload a patch for an existing release.
    /// POST /releases/:id/patches
    pub async fn upload_patch(
        &self,
        release_id: &str,
        base_version: &str,
        hash: &str,
        signature: &str,
        patch_path: &Path,
    ) -> Result<()> {
        let url = format!("{}/releases/{}/patches", self.base_url, release_id);

        let patch_bytes = tokio::fs::read(patch_path)
            .await
            .context("Failed to read patch file")?;

        let metadata = serde_json::json!({
            "base_version": base_version,
            "hash": hash,
            "signature": signature,
            "size": patch_bytes.len(),
        });

        let form = multipart::Form::new()
            .text("metadata", metadata.to_string())
            .part(
                "patch",
                multipart::Part::bytes(patch_bytes)
                    .file_name("diff.patch")
                    .mime_str("application/octet-stream")?,
            );

        let resp = self
            .client
            .post(&url)
            .bearer_auth(&self.token)
            .multipart(form)
            .send()
            .await
            .context("Failed to upload patch")?;

        if !resp.status().is_success() {
            let err: ErrorResponse = resp.json().await.unwrap_or(ErrorResponse {
                error: "Unknown error".to_string(),
            });
            anyhow::bail!("Patch upload failed: {}", err.error);
        }

        Ok(())
    }
}
