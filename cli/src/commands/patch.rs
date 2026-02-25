use anyhow::{Context, Result};
use colored::Colorize;
use crate::api::ApiClient;
use crate::config::Config;
use crate::utils;
use crate::signing;

/// Execute the `hotpatch patch` command.
/// Generates a binary diff between two local files or versions.
pub async fn execute(
    old_ver: &str,
    new_ver: &str,
    channel: &str,
    output: Option<&str>,
) -> Result<()> {
    let config = Config::load_or_exit()?;
    let client = ApiClient::new(&config.api_endpoint, &config.api_token);

    println!("{}", "  🔧 HotPatch Patch Generator".bold());
    println!("{}", "  ─────────────────────────────────".dimmed());

    // 1. Fetch release info for versions
    let releases = client.list_releases(channel).await?;
    let old_info = releases.iter().find(|r| r.version == old_ver)
        .context(format!("Version {} not found in channel {}", old_ver, channel))?;
    let new_info = releases.iter().find(|r| r.version == new_ver)
        .context(format!("Version {} not found in channel {}", new_ver, channel))?;

    // 2. Setup temp directory
    let temp_dir = std::env::temp_dir().join("hotpatch-patch");
    if !temp_dir.exists() { std::fs::create_dir_all(&temp_dir)?; }

    let old_path = temp_dir.join(format!("{}.zip", old_ver));
    let new_path = temp_dir.join(format!("{}.zip", new_ver));
    let patch_path = if let Some(out) = output {
        std::path::PathBuf::from(out)
    } else {
        temp_dir.join(format!("{}_to_{}.patch", old_ver, new_ver))
    };

    // 3. Download and Resolve bundles (handle encryption)
    println!("  ⏬ Downloading base version {}...", old_ver.cyan());
    client.download_bundle(&old_info.bundle_url, &old_path).await?;
    let resolved_old = if old_info.is_encrypted {
        println!("  🔓 Decrypting base version...");
        let key_hex = if let Some(kid) = &old_info.key_id {
            let keys = config.encryption_keys.as_ref().context("Keyring not found")?;
            keys.get(kid).context(format!("Encryption key {} not found in keyring", kid))?
        } else {
            config.encryption_key.as_ref().context("Legacy encryption key not found")?
        };
        let key = hex::decode(key_hex)?;
        let dec_path = temp_dir.join(format!("{}.dec", old_ver));
        utils::encryption::decrypt_file(&old_path, &dec_path, &key)?;
        dec_path
    } else {
        old_path.clone()
    };
    
    println!("  ⏬ Downloading target version {}...", new_ver.cyan());
    client.download_bundle(&new_info.bundle_url, &new_path).await?;
    let resolved_new = if new_info.is_encrypted {
        println!("  🔓 Decrypting target version...");
        let key_hex = if let Some(kid) = &new_info.key_id {
            let keys = config.encryption_keys.as_ref().context("Keyring not found")?;
            keys.get(kid).context(format!("Encryption key {} not found in keyring", kid))?
        } else {
            config.encryption_key.as_ref().context("Legacy encryption key not found")?
        };
        let key = hex::decode(key_hex)?;
        let dec_path = temp_dir.join(format!("{}.dec", new_ver));
        utils::encryption::decrypt_file(&new_path, &dec_path, &key)?;
        dec_path
    } else {
        new_path.clone()
    };

    // 4. Generate diff
    println!("  Diffing layers...");
    utils::diff::create_patch(&resolved_old, &resolved_new, &patch_path)?;

    // 5. Hash and sign (of the PLAIN patch)
    let patch_hash = utils::sha256_file(patch_path.to_str().unwrap())?;
    let patch_sig = signing::sign_file(patch_path.to_str().unwrap())?;

    // 6. Upload
    println!("  ⏫ Uploading patch to backend...");
    client.upload_patch(&new_info.id, &old_info.version, &patch_hash, &patch_sig, &patch_path).await?;

    println!();
    println!("  {} Patch generated and uploaded successfully!", "✓".green().bold());
    println!("  {} Source:  {}", "→".dimmed(), old_ver);
    println!("  {} Target:  {}", "→".dimmed(), new_ver);
    println!("  {} Size:    {} bytes", "→".dimmed(), std::fs::metadata(&patch_path)?.len());

    // Cleanup
    let _ = std::fs::remove_file(&old_path);
    let _ = std::fs::remove_file(&new_path);
    if resolved_old != old_path { let _ = std::fs::remove_file(&resolved_old); }
    if resolved_new != new_path { let _ = std::fs::remove_file(&resolved_new); }

    Ok(())
}
