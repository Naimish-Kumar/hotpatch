use anyhow::Result;
use colored::Colorize;
use dialoguer::Confirm;

use crate::api::ApiClient;
use crate::config::Config;

/// Execute the `hotpatch rollback` command.
///
/// Lists recent releases for the given channel and lets the user
/// select a version to roll back to. Sends a rollback request to the backend.
pub async fn execute(platform: &str, version: &str, channel: &str) -> Result<()> {
    let config = Config::load_or_exit()?;

    println!("{}", "  ⏪ HotPatch Rollback".bold());
    println!("{}", "  ─────────────────────────────────".dimmed());
    println!(
        "{}",
        format!("  Platform:  {}", platform).white()
    );
    println!(
        "{}",
        format!("  Target:    v{}", version).white()
    );
    println!(
        "{}",
        format!("  Channel:   {}", channel).white()
    );
    println!();

    // Fetch available releases for this channel
    let client = ApiClient::new(&config.api_endpoint, &config.api_token);
    let releases = client.list_releases(channel).await?;

    if releases.is_empty() {
        println!(
            "{}",
            format!("  ❌ No releases found for channel '{}'", channel)
                .red()
                .bold()
        );
        return Ok(());
    }

    // Find the target version
    let target = releases.iter().find(|r| r.version == version);

    match target {
        Some(release) => {
            println!(
                "{}",
                format!("  Found release: {} (ID: {})", release.version, release.id).white()
            );
            println!(
                "{}",
                format!("  Status: {}", if release.is_active { "active" } else { "inactive" })
                    .white()
            );
            println!();

            // Confirm rollback
            let confirmed = Confirm::new()
                .with_prompt(format!(
                    "  Roll back {} channel to v{}?",
                    channel, version
                ))
                .default(false)
                .interact()?;

            if !confirmed {
                println!("{}", "  Rollback cancelled.".dimmed());
                return Ok(());
            }

            println!();
            println!("{}", "  ⏳ Rolling back...".cyan());

            let result = client.rollback(&release.id).await?;

            println!();
            println!(
                "{}",
                "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━".cyan()
            );
            println!(
                "{}",
                format!("  ✅ {}", result.message).green().bold()
            );
            println!(
                "{}",
                "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━".cyan()
            );
            println!(
                "{}",
                format!(
                    "  Active version is now: v{}",
                    result.release.version
                )
                .white()
            );
            println!();
        }
        None => {
            println!(
                "{}",
                format!(
                    "  ❌ Version {} not found in channel '{}'",
                    version, channel
                )
                .red()
                .bold()
            );
            println!();
            println!("{}", "  Available versions:".bold());
            for r in releases.iter().take(10) {
                let status = if r.is_active {
                    "● active".green().to_string()
                } else {
                    "○ inactive".dimmed().to_string()
                };
                println!(
                    "{}",
                    format!("    v{:<12} {} ({})", r.version, status, r.created_at).white()
                );
            }
            println!();
        }
    }

    Ok(())
}
