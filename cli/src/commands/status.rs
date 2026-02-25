use anyhow::Result;
use colored::Colorize;

use crate::config::Config;

/// Execute the `hotpatch status` command.
///
/// Displays the current configuration status and auth info.
pub fn execute() -> Result<()> {
    println!("{}", "  📋 HotPatch Status".bold());
    println!("{}", "  ─────────────────────────────────".dimmed());
    println!();

    // Check config
    match Config::load()? {
        Some(config) => {
            println!(
                "{}",
                "  Authentication:  ✅ Logged in".green()
            );
            println!(
                "{}",
                format!("  API Endpoint:    {}", config.api_endpoint).white()
            );

            // Mask the token
            let token_preview = if config.api_token.len() > 20 {
                format!("{}...{}", &config.api_token[..10], &config.api_token[config.api_token.len()-6..])
            } else {
                "****".to_string()
            };
            println!(
                "{}",
                format!("  API Token:       {}", token_preview).white()
            );

            if let Some(app_id) = &config.app_id {
                println!(
                    "{}",
                    format!("  App ID:          {}", app_id).white()
                );
            }

            if let Some(tier) = &config.tier {
                let tier_display = match tier.as_str() {
                    "free" => tier.to_uppercase().white(),
                    "pro" => tier.to_uppercase().yellow().bold(),
                    "enterprise" => tier.to_uppercase().magenta().bold(),
                    _ => tier.to_uppercase().white(),
                };
                println!(
                    "{}",
                    format!("  Plan Tier:       {}", tier_display)
                );
            }
        }
        None => {
            println!(
                "{}",
                "  Authentication:  ❌ Not logged in".red()
            );
            println!(
                "{}",
                "  Run `hotpatch login` to authenticate.".dimmed()
            );
        }
    }

    println!();

    // Check signing keys
    let signing_key_path = Config::signing_key_path()?;
    let public_key_path = Config::public_key_path()?;

    if signing_key_path.exists() {
        println!(
            "{}",
            format!(
                "  Signing Key:     ✅ {}",
                signing_key_path.display()
            )
            .green()
        );
    } else {
        println!(
            "{}",
            "  Signing Key:     ❌ Not generated".red()
        );
    }

    if public_key_path.exists() {
        println!(
            "{}",
            format!(
                "  Public Key:      ✅ {}",
                public_key_path.display()
            )
            .green()
        );

        // Show the public key for embedding in the app
        if let Ok(pubkey) = std::fs::read_to_string(&public_key_path) {
            println!();
            println!("{}", "  Public key for your React Native app:".bold());
            println!(
                "{}",
                format!("  {}", pubkey.trim()).cyan()
            );
        }
    } else {
        println!(
            "{}",
            "  Public Key:      ❌ Not generated".red()
        );
        println!(
            "{}",
            "  Run `hotpatch keygen` to generate a signing keypair.".dimmed()
        );
    }

    println!();

    // Config file location
    match Config::path() {
        Ok(path) => {
            println!(
                "{}",
                format!("  Config Path:     {}", path.display()).dimmed()
            );
        }
        Err(_) => {}
    }

    println!();

    Ok(())
}
