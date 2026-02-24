use anyhow::{Context, Result};
use colored::Colorize;
use indicatif::{ProgressBar, ProgressStyle};
use std::time::Duration;

use crate::api::{ApiClient, ReleaseMetadata};
use crate::bundle;
use crate::config::Config;
use crate::signing;
use crate::utils;

/// Execute the `hotpatch release` command.
///
/// The full publish pipeline:
/// 1. Build React Native JS bundle
/// 2. Compress into ZIP
/// 3. Compute SHA256 hash
/// 4. Sign with Ed25519 private key
/// 5. Upload to HotPatch backend
/// 6. Report success
pub async fn execute(
    platform: &str,
    version: &str,
    channel: &str,
    mandatory: bool,
    rollout: u8,
    entry_file: &str,
    build_dir: &str,
    encrypt: bool,
) -> Result<()> {
    // Validate inputs
    if rollout == 0 || rollout > 100 {
        anyhow::bail!("Rollout percentage must be between 1 and 100");
    }
    if platform != "android" && platform != "ios" {
        anyhow::bail!("Platform must be 'android' or 'ios'");
    }

    // Load configuration
    let config = Config::load_or_exit()?;

    println!("{}", "  🚀 HotPatch Release".bold());
    println!("{}", "  ─────────────────────────────────".dimmed());
    println!(
        "{}",
        format!("  Platform:  {}", platform).white()
    );
    println!(
        "{}",
        format!("  Version:   {}", version).white()
    );
    println!(
        "{}",
        format!("  Channel:   {}", channel).white()
    );
    println!(
        "{}",
        format!("  Mandatory: {}", mandatory).white()
    );
    println!(
        "{}",
        format!("  Rollout:   {}%", rollout).white()
    );
    println!();

    // ── Step 1: Build the React Native bundle ──
    let spinner = create_spinner("Building React Native bundle...");
    bundle::build_bundle(platform, entry_file, build_dir)?;
    spinner.finish_with_message("Bundle built ✓".green().to_string());

    // ── Step 2: Compress into ZIP ──
    let zip_path_str = format!("{}/bundle.zip", build_dir);
    let spinner = create_spinner("Compressing bundle...");
    let zip_path = bundle::compress_bundle(build_dir, &zip_path_str)?;
    spinner.finish_with_message("Bundle compressed ✓".green().to_string());

    // ── Step 2.5: Encryption (Optional) ──
    let (active_key_id, active_key_hex) = if encrypt {
        if let Some(id) = &config.active_key_id {
            let keys = config.encryption_keys.as_ref().context("Keyring is empty")?;
            let key = keys.get(id).context("Active key not found in keyring")?;
            (Some(id.clone()), Some(key.clone()))
        } else if let Some(key) = &config.encryption_key {
            (None, Some(key.clone()))
        } else {
            anyhow::bail!("Encryption requested but no keys found in config. Create one first.");
        }
    } else {
        (None, None)
    };

    let final_zip_path = if let Some(key_hex) = active_key_hex {
        let spinner = create_spinner("Encrypting bundle with AES-256-GCM...");
        let key = hex::decode(&key_hex).context("Invalid encryption key format")?;
        
        let encrypted_path = format!("{}/bundle.enc", build_dir);
        utils::encryption::encrypt_file(&zip_path, std::path::Path::new(&encrypted_path), &key)?;
        spinner.finish_with_message("Bundle encrypted ✓".green().to_string());
        std::path::PathBuf::from(encrypted_path)
    } else {
        zip_path.clone()
    };

    // ── Step 3: Compute SHA256 hash ──
    let spinner = create_spinner("Computing SHA256 hash...");
    let hash = utils::sha256_file(final_zip_path.to_str().unwrap())?;
    spinner.finish_with_message(
        format!("SHA256: {}...{} ✓", &hash[..8], &hash[56..]).green().to_string(),
    );

    // ── Step 4: Sign with Ed25519 ──
    let spinner = create_spinner("Signing bundle with Ed25519...");
    let signature = signing::sign_file(final_zip_path.to_str().unwrap())?;
    spinner.finish_with_message(
        format!("Signed: {}... ✓", &signature[..16]).green().to_string(),
    );

    // ── Step 5: Upload to backend ──
    let spinner = create_spinner("Uploading to HotPatch backend...");
    let client = ApiClient::new(&config.api_endpoint, &config.api_token);

    let metadata = ReleaseMetadata {
        version: version.to_string(),
        channel: channel.to_string(),
        platform: platform.to_string(),
        mandatory,
        rollout_percentage: rollout,
        hash: hash.clone(),
        signature: signature.clone(),
        is_encrypted: encrypt,
        is_patch: false,
        base_version: None,
        key_id: active_key_id,
        size: std::fs::metadata(&final_zip_path)?.len(),
    };

    let release = client.upload_release(&metadata, &final_zip_path).await?;
    spinner.finish_with_message("Uploaded successfully ✓".green().to_string());

    // ── Step 5.5: Generate Diff patches for previous versions ──
    let previous_releases = client.list_releases(channel).await?;
    if let Some(prev) = previous_releases.iter().find(|r| r.id != release.id) {
        let spinner = create_spinner(format!("Generating diff patch from version {}...", prev.version).as_str());
        
        // Download previous bundle
        let prev_bundle_path = std::path::PathBuf::from(format!("{}/prev_bundle.zip", build_dir));
        client.download_bundle(&prev.bundle_url, &prev_bundle_path).await?;

        // If prev was encrypted, decrypt it first to binary diff plain bytes (more efficient)
        let resolved_prev_path = if prev.is_encrypted {
            let key_hex = if let Some(kid) = &prev.key_id {
                let keys = config.encryption_keys.as_ref().context("Keyring not found")?;
                keys.get(kid).context(format!("Encryption key {} not found in keyring", kid))?
            } else {
                config.encryption_key.as_ref().context("Legacy encryption key not found")?
            };
            let key = hex::decode(key_hex)?;
            let decrypted_path = format!("{}/prev_bundle.dec", build_dir);
            utils::encryption::decrypt_file(&prev_bundle_path, std::path::Path::new(&decrypted_path), &key)?;
            std::path::PathBuf::from(decrypted_path)
        } else {
            prev_bundle_path.clone()
        };

        // Create patch (Compare plain old to plain new)
        let patch_path = std::path::PathBuf::from(format!("{}/diff.patch", build_dir));
        utils::diff::create_patch(&resolved_prev_path, &zip_path, &patch_path)?;

        // Hash and sign the patch (of the PLAIN patch)
        let patch_hash = utils::sha256_file(patch_path.to_str().unwrap())?;
        let patch_sig = signing::sign_file(patch_path.to_str().unwrap())?;

        // Upload patch
        client.upload_patch(&release.id, &prev.version, &patch_hash, &patch_sig, &patch_path).await?;
        
        spinner.finish_with_message(format!("Diff patch generated ({} -> {}) ✓", prev.version, version).green().to_string());
        
        // Cleanup patch artifacts
        let _ = std::fs::remove_file(&prev_bundle_path);
        let _ = std::fs::remove_file(&patch_path);
    }

    // ── Step 6: Report success ──
    println!();
    println!(
        "{}",
        "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━".cyan()
    );
    println!(
        "{}",
        "  ⚡ Release published successfully!".green().bold()
    );
    println!(
        "{}",
        "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━".cyan()
    );
    println!(
        "{}",
        format!("  Release ID:      {}", release.id).white()
    );
    println!(
        "{}",
        format!("  Version:         {}", release.version).white()
    );
    println!(
        "{}",
        format!("  Channel:         {}", release.channel).white()
    );
    println!(
        "{}",
        format!("  Rollout:         {}%", release.rollout_percentage).white()
    );
    println!(
        "{}",
        format!("  Active:          {}", release.is_active).white()
    );
    println!();

    if rollout < 100 {
        println!(
            "{}",
            format!(
                "  💡 Staged rollout at {}%. Increase with:",
                rollout
            )
            .yellow()
        );
        println!(
            "{}",
            "     hotpatch release --rollout 100".dimmed()
        );
    }

    // Cleanup build artifacts
    if let Err(e) = std::fs::remove_file(&zip_path) {
        eprintln!(
            "{}",
            format!("  ⚠️  Could not clean up {}: {}", zip_path.display(), e).dimmed()
        );
    }

    Ok(())
}

fn create_spinner(message: &str) -> ProgressBar {
    let pb = ProgressBar::new_spinner();
    pb.set_style(
        ProgressStyle::with_template("  {spinner:.cyan} {msg}")
            .unwrap()
            .tick_chars("⠁⠂⠄⡀⢀⠠⠐⠈ "),
    );
    pb.set_message(message.to_string());
    pb.enable_steady_tick(Duration::from_millis(80));
    pb
}
