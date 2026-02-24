use anyhow::{anyhow, Result};
use colored::Colorize;
use crate::api::ApiClient;
use crate::config::Config;
use std::sync::mpsc;
use std::thread;
use tiny_http::{Response, Server};
use url::Url;

/// Execute the `hotpatch login` command.
///
/// Shorebird-style login: Opens the browser for Google OAuth,
/// captures the token via a local server.
pub async fn execute() -> Result<()> {
    println!("{}", "  🔑 HotPatch Login".bold());
    println!("{}", "  ─────────────────────────────────".dimmed());
    println!();

    // Default backend URL
    let backend_url = "http://localhost:8080";
    
    // Start local server to receive the callback
    let port = 8081;
    let server = Server::http(format!("0.0.0.0:{}", port))
        .map_err(|e| anyhow!("Could not start local server on port {}: {}", port, e))?;

    println!("{}", format!("  ⏳ Opening your browser to authenticate...").cyan());
    
    // Construct the login URL
    // State is used to tell the backend which port we are listening on
    let login_url = format!("{}/auth/google/login?state=cli:{}", backend_url, port);
    
    if let Err(e) = webbrowser::open(&login_url) {
        println!("{}", format!("  ⚠️  Failed to open browser automatically: {}", e).yellow());
        println!("{}", "  Please manually visit:".dimmed());
        println!("  {}", login_url.underline().blue());
    }

    println!("{}", "  Waiting for authentication...".dimmed());

    // Wait for the redirect in a separate thread or block
    let (tx, rx) = mpsc::channel();
    
    thread::spawn(move || {
        for request in server.incoming_requests() {
            let url = format!("http://localhost{}{}", port, request.url());
            if let Ok(parsed_url) = Url::parse(&url) {
                if let Some(token) = parsed_url.query_pairs().find(|(k, _)| k == "token").map(|(_, v)| v.into_owned()) {
                    let response = Response::from_string("Authentication successful! You can now close this window.")
                        .with_header(tiny_http::Header::from_bytes(&b"Content-Type"[..], &b"text/plain"[..]).unwrap());
                    let _ = request.respond(response);
                    let _ = tx.send(token);
                    break;
                }
            }
            let _ = request.respond(Response::from_string("Waiting for token..."));
        }
    });

    // Wait for token from the channel
    let token = rx.recv().map_err(|_| anyhow!("Login cancelled or failed"))?;

    // Create a client with the new token to fetch app info (optional, or just save token)
    let client = ApiClient::new(backend_url, &token);
    
    // Save configuration
    let config = Config {
        api_endpoint: backend_url.to_string(),
        api_token: token,
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
