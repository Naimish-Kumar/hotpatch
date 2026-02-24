use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use anyhow::{Context, Result};
use rand::RngCore;
use std::fs;
use std::path::Path;

pub fn encrypt_file(input_path: &Path, output_path: &Path, key: &[u8]) -> Result<()> {
    if key.len() != 32 {
        anyhow::bail!("AES-256 key must be 32 bytes");
    }

    let data = fs::read(input_path)
        .with_context(|| format!("Failed to read file for encryption: {}", input_path.display()))?;

    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| anyhow::anyhow!("Invalid key length: {}", e))?;

    // Generate a 96-bit nonce
    let mut nonce_bytes = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, data.as_slice())
        .map_err(|e| anyhow::anyhow!("Encryption failed: {}", e))?;

    // Prepend nonce to the ciphertext
    let mut encrypted_data = Vec::with_capacity(nonce_bytes.len() + ciphertext.len());
    encrypted_data.extend_from_slice(&nonce_bytes);
    encrypted_data.extend_from_slice(&ciphertext);

    fs::write(output_path, encrypted_data)
        .with_context(|| format!("Failed to write encrypted file: {}", output_path.display()))?;

    Ok(())
}
pub fn decrypt_file(input_path: &Path, output_path: &Path, key: &[u8]) -> Result<()> {
    if key.len() != 32 {
        anyhow::bail!("AES-256 key must be 32 bytes");
    }

    let data = fs::read(input_path)
        .with_context(|| format!("Failed to read file for decryption: {}", input_path.display()))?;

    if data.len() < 12 {
        anyhow::bail!("Encrypted file too small (no nonce)");
    }

    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| anyhow::anyhow!("Invalid key length: {}", e))?;

    let (nonce_bytes, ciphertext) = data.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| anyhow::anyhow!("Decryption failed: {}. Are you using the correct key?", e))?;

    fs::write(output_path, plaintext)
        .with_context(|| format!("Failed to write decrypted file: {}", output_path.display()))?;

    Ok(())
}
