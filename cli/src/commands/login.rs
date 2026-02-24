use anyhow::Result;
use colored::Colorize;
use dialoguer::{Input, Password};

use crate::api::ApiClient;
use crate::config::Config;

/// Execute the `hotpatch login` command.
///
/// Prompts the user for their API endpoint and API key,
/// authenticates with the backend, and stores the JWT token.
pub async fn execute() -> Result<()> {
    println!("{}", "  🔑 HotPatch Login".bold());
    println!("{}", "  ─────────────────────────────────".dimmed());
    println!();

    // Prompt for API endpoint
    let api_endpoint: String = Input::new()
        .with_prompt("  API Endpoint")
        .default("http://localhost:8080".to_string())
        .interact_text()?;

    // Prompt for API key (hidden input)
    let api_key: String = Password::new()
        .with_prompt("  API Key")
        .interact()?;

    println!();
    println!("{}", "  ⏳ Authenticating...".cyan());

    // Exchange API key for JWT token
    let client = ApiClient::new(&api_endpoint, "");
    let token_response = client.authenticate(&api_key).await?;

    // Save configuration
    let config = Config {
        api_endpoint: api_endpoint.clone(),
        api_token: token_response.access_token,
        app_id: None,
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
        format!(
            "  Token expires in {} hours",
            token_response.expires_in / 3600
        )
        .dimmed()
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
