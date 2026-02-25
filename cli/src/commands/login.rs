use anyhow::{anyhow, Context, Result};
use colored::Colorize;
use crate::api::ApiClient;
use crate::config::Config;
use std::io::{self, Write};
use std::sync::mpsc;
use std::thread;
use tiny_http::{Response, Server};
use url::Url;

/// Execute the `hotpatch login` command.
/// 
/// As per documentation Page 6:
/// Prompts for API Endpoint and API Token.
pub async fn execute() -> Result<()> {
    println!("{}", "  🔑 HotPatch Login".bold());
    println!("{}", "  ─────────────────────────────────".dimmed());
    println!();

    let mut api_endpoint = String::new();
    print!("  {} (e.g. https://api.hotpatch.dev): ", "API Endpoint:".bold());
    io::stdout().flush()?;
    io::stdin().read_line(&mut api_endpoint)?;
    let api_endpoint = api_endpoint.trim().to_string();

    if api_endpoint.is_empty() {
        anyhow::bail!("API Endpoint is required");
    }

    let mut api_key = String::new();
    print!("  {}: ", "API Token:".bold());
    io::stdout().flush()?;
    io::stdin().read_line(&mut api_key)?;
    let api_key = api_key.trim().to_string();

    if api_key.is_empty() {
        anyhow::bail!("API Token is required");
    }

    println!();
    println!("{}", "  Authenticating...".dimmed());

    // Create a temporary client with empty token to exchange the API Key for a JWT
    let temp_client = ApiClient::new(&api_endpoint, "");
    let auth_resp = temp_client.authenticate(&api_key).await?;

    // Save configuration with the JWT token
    let config = Config {
        api_endpoint: api_endpoint.clone(),
        api_token: auth_resp.access_token,
        app_id: Some(auth_resp.app.id.clone()),
        tier: Some(auth_resp.app.tier.clone()),
        encryption_key: None,
        active_key_id: None,
        encryption_keys: None,
    };
    config.save()?;

    println!();
    println!(
        "{}",
        "  ✅ Login successful!".green().bold()
    );
    println!(
        "{}",
        format!("  Config saved to {}", Config::path()?.display()).dimmed()
    );
    println!();
    println!("{}", "  Next steps:".bold());
    println!(
        "{}",
        "  1. Run `hotpatch keygen` to generate a signing keypair".white()
    );
    println!(
        "{}",
        "  2. Run `hotpatch release --platform android --version 1.0.0` to publish"
            .white()
    );

    Ok(())
}
