use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// Configuration stored at ~/.hotpatch/config.toml
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Config {
    pub api_endpoint: String,
    pub api_token: String,
    pub app_id: Option<String>,
    pub tier: Option<String>,
    pub encryption_key: Option<String>, // Legacy single key
    pub active_key_id: Option<String>,
    pub encryption_keys: Option<std::collections::HashMap<String, String>>, // ID -> Hex Key
}

impl Config {
    /// Returns the path to the config directory (~/.hotpatch/).
    pub fn dir() -> Result<PathBuf> {
        let home = dirs::home_dir().context("Could not determine home directory")?;
        let config_dir = home.join(".hotpatch");
        Ok(config_dir)
    }

    /// Returns the path to the config file (~/.hotpatch/config.toml).
    pub fn path() -> Result<PathBuf> {
        Ok(Self::dir()?.join("config.toml"))
    }

    /// Returns the path to the signing key (~/.hotpatch/signing_key.pem).
    pub fn signing_key_path() -> Result<PathBuf> {
        Ok(Self::dir()?.join("signing_key.pem"))
    }

    /// Returns the path to the public key (~/.hotpatch/public_key.pem).
    pub fn public_key_path() -> Result<PathBuf> {
        Ok(Self::dir()?.join("public_key.pem"))
    }

    /// Load config from disk. Returns None if no config file exists.
    pub fn load() -> Result<Option<Config>> {
        let path = Self::path()?;
        if !path.exists() {
            return Ok(None);
        }

        let contents = fs::read_to_string(&path)
            .with_context(|| format!("Failed to read config at {}", path.display()))?;

        let config: Config = toml::from_str(&contents)
            .with_context(|| "Failed to parse config.toml")?;

        Ok(Some(config))
    }

    /// Save config to disk. Creates the directory if it doesn't exist.
    pub fn save(&self) -> Result<()> {
        let dir = Self::dir()?;
        fs::create_dir_all(&dir)
            .with_context(|| format!("Failed to create config directory at {}", dir.display()))?;

        let path = Self::path()?;
        let contents = toml::to_string_pretty(self)
            .context("Failed to serialize config")?;

        fs::write(&path, &contents)
            .with_context(|| format!("Failed to write config to {}", path.display()))?;

        // Set restrictive permissions on Unix
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            fs::set_permissions(&path, fs::Permissions::from_mode(0o600))?;
        }

        Ok(())
    }

    /// Load config or exit with a helpful message if not logged in.
    pub fn load_or_exit() -> Result<Config> {
        match Self::load()? {
            Some(config) => Ok(config),
            None => {
                anyhow::bail!(
                    "Not logged in. Run `hotpatch login` first to configure your API endpoint and token."
                );
            }
        }
    }
}
