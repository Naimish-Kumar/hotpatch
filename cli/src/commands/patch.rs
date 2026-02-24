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

    // 3. Download bundles
    println!("  ⏬ Downloading base version {}...", old_ver.cyan());
    client.download_bundle(&old_info.bundle_url, &old_path).await?;
    
    println!("  ⏬ Downloading target version {}...", new_ver.cyan());
    client.download_bundle(&new_info.bundle_url, &new_path).await?;

    // 4. Generate diff
    println!("  Diffing layers...");
    utils::diff::create_patch(&old_path, &new_path, &patch_path)?;

    // 5. Hash and sign
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

    Ok(())
}
