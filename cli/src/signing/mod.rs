use anyhow::{Context, Result};
use base64::{engine::general_purpose::STANDARD, Engine as _};
use colored::Colorize;
use ed25519_dalek::{Signer, SigningKey, VerifyingKey};
use rand::rngs::OsRng;
use std::fs;
use crate::config::Config;

/// Generates an Ed25519 keypair and saves to ~/.hotpatch/.
///
/// The private key is used by the CLI to sign bundles.
/// The public key should be embedded in the React Native app to verify updates.
pub fn generate_keypair(force: bool) -> Result<()> {
    let private_path = Config::signing_key_path()?;
    let public_path = Config::public_key_path()?;

    if private_path.exists() && !force {
        anyhow::bail!(
            "Signing key already exists at {}. Use --force to overwrite.",
            private_path.display()
        );
    }

    println!("{}", "  🔐 Generating Ed25519 signing keypair...".cyan());

    // Generate keypair
    let mut csprng = OsRng;
    let signing_key = SigningKey::generate(&mut csprng);
    let verifying_key: VerifyingKey = (&signing_key).into();

    // Ensure directory exists
    let config_dir = Config::dir()?;
    fs::create_dir_all(&config_dir)?;

    // Save private key (raw 32 bytes, base64 encoded)
    let private_b64 = STANDARD.encode(signing_key.as_bytes());
    fs::write(&private_path, &private_b64)
        .with_context(|| format!("Failed to write signing key at {}", private_path.display()))?;

    // Set restrictive permissions on Unix
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        fs::set_permissions(&private_path, fs::Permissions::from_mode(0o600))?;
    }

    // Save public key (raw 32 bytes, base64 encoded)
    let public_b64 = STANDARD.encode(verifying_key.as_bytes());
    fs::write(&public_path, &public_b64)
        .with_context(|| format!("Failed to write public key at {}", public_path.display()))?;

    println!(
        "{}",
        format!("  ✅ Private key saved to: {}", private_path.display()).green()
    );
    println!(
        "{}",
        format!("  ✅ Public key saved to:  {}", public_path.display()).green()
    );
    println!();
    println!("{}", "  ⚠️  IMPORTANT:".yellow().bold());
    println!(
        "{}",
        "  • Keep the private key secret — it signs your updates".yellow()
    );
    println!(
        "{}",
        "  • Embed the public key in your React Native app to verify updates"
            .yellow()
    );
    println!(
        "{}",
        format!("  • Public key (base64): {}", public_b64).white()
    );

    Ok(())
}

/// Signs a file with the Ed25519 private key.
/// Returns the signature as a base64 string.
pub fn sign_file(file_path: &str) -> Result<String> {
    let private_path = Config::signing_key_path()?;
    if !private_path.exists() {
        anyhow::bail!(
            "No signing key found at {}. Run `hotpatch keygen` first.",
            private_path.display()
        );
    }

    // Load private key
    let key_b64 = fs::read_to_string(&private_path).context("Failed to read signing key")?;
    let key_bytes = STANDARD
        .decode(key_b64.trim())
        .context("Failed to decode signing key")?;

    let key_array: [u8; 32] = key_bytes
        .try_into()
        .map_err(|_| anyhow::anyhow!("Signing key must be 32 bytes"))?;

    let signing_key = SigningKey::from_bytes(&key_array);

    // Read file and sign
    let file_bytes = fs::read(file_path)
        .with_context(|| format!("Failed to read file for signing: {}", file_path))?;

    let signature = signing_key.sign(&file_bytes);

    let sig_b64 = STANDARD.encode(signature.to_bytes());

    Ok(sig_b64)
}
