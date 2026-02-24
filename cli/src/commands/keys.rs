use anyhow::{Context, Result};
use colored::Colorize;
use rand::RngCore;
use std::collections::HashMap;
use crate::config::Config;
use crate::KeyCommands;

pub fn execute(cmd: KeyCommands) -> Result<()> {
    let mut config = Config::load_or_exit()?;

    match cmd {
        KeyCommands::List => {
            println!("{}", "  🔑 Keyring Status".bold());
            println!("{}", "  ─────────────────────────────────".dimmed());
            
            let keys = config.encryption_keys.as_ref().context("Keyring is empty. Generate a key first.")?;
            let active_id = config.active_key_id.as_deref().unwrap_or("none");

            for (id, key) in keys {
                let status = if id == active_id {
                    " (ACTIVE)".green().bold()
                } else {
                    "".clear()
                };
                println!("  ID: {} {}", id.cyan(), status);
                println!("  Key: {}...{}", &key[..8], &key[56..]);
                println!();
            }
        }
        KeyCommands::Generate { id, active } => {
            let mut key_bytes = [0u8; 32];
            rand::thread_rng().fill_bytes(&mut key_bytes);
            let key_hex = hex::encode(key_bytes);
            
            let key_id = id.unwrap_or_else(|| {
                // Generate a short ID from hash
                use sha2::{Digest, Sha256};
                let mut hasher = Sha256::new();
                hasher.update(&key_bytes);
                let result = hasher.finalize();
                hex::encode(&result[..4]) // 8 chars
            });

            let mut keys = config.encryption_keys.take().unwrap_or_default();
            keys.insert(key_id.clone(), key_hex);
            
            config.encryption_keys = Some(keys);
            if active {
                config.active_key_id = Some(key_id.clone());
            }

            config.save()?;
            println!("{} New key generated with ID: {}", "✓".green(), key_id.cyan());
            if active {
                println!("{} Key set as active for new releases.", "✓".green());
            }
        }
        KeyCommands::Select { id } => {
            let keys = config.encryption_keys.as_ref().context("Keyring is empty")?;
            if !keys.contains_key(&id) {
                anyhow::bail!("Key ID '{}' not found in keyring.", id);
            }
            config.active_key_id = Some(id.clone());
            config.save()?;
            println!("{} Set active key to: {}", "✓".green(), id.cyan());
        }
        KeyCommands::Remove { id } => {
            let mut keys = config.encryption_keys.take().context("Keyring is empty")?;
            if keys.remove(&id).is_some() {
                if config.active_key_id.as_deref() == Some(&id) {
                    config.active_key_id = None;
                }
                config.encryption_keys = Some(keys);
                config.save()?;
                println!("{} Removed key: {}", "✓".green(), id.cyan());
            } else {
                anyhow::bail!("Key ID '{}' not found.", id);
            }
        }
    }

    Ok(())
}
