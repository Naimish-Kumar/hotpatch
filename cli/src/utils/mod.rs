use anyhow::{Context, Result};
use sha2::{Digest, Sha256};
use std::fs::File;
use std::io::Read;

/// Computes the SHA256 hash of a file and returns it as a lowercase hex string.
pub fn sha256_file(path: &str) -> Result<String> {
    let mut file =
        File::open(path).with_context(|| format!("Failed to open file for hashing: {}", path))?;

    let mut hasher = Sha256::new();
    let mut buffer = [0u8; 8192];

    loop {
        let bytes_read = file.read(&mut buffer).context("Failed to read file")?;
        if bytes_read == 0 {
            break;
        }
        hasher.update(&buffer[..bytes_read]);
    }

    let hash = hasher.finalize();
    Ok(format!("{:x}", hash))
}

pub mod encryption;
pub mod diff;
