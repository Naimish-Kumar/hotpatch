use anyhow::Result;
use clap::{Parser, Subcommand};
use colored::Colorize;

mod api;
mod bundle;
mod commands;
mod config;
mod signing;
mod utils;

/// ⚡ HotPatch CLI — OTA Updates for React Native
#[derive(Parser)]
#[command(
    name = "hotpatch",
    version,
    about = "⚡ HotPatch CLI — Push OTA updates to React Native apps instantly",
    long_about = "HotPatch CLI is the developer tool for building, signing, and publishing\n\
                  Over-The-Air updates to your React Native applications.\n\n\
                  Get started:\n  \
                  hotpatch login          Authenticate with your HotPatch account\n  \
                  hotpatch release        Build and publish an OTA update\n  \
                  hotpatch rollback       Revert to a previous version\n  \
                  hotpatch keygen         Generate Ed25519 signing keypair"
)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Authenticate with your HotPatch backend and store credentials
    Login,

    /// Build, sign, and publish an OTA update to your backend
    Release {
        /// Target platform
        #[arg(short, long)]
        platform: String,

        /// Semver version string (e.g. 1.2.0)
        #[arg(short, long)]
        version: String,

        /// Release channel
        #[arg(short, long, default_value = "production")]
        channel: String,

        /// Force immediate update on all devices
        #[arg(short, long, default_value_t = false)]
        mandatory: bool,

        /// Rollout percentage (1-100)
        #[arg(short, long, default_value_t = 100)]
        rollout: u8,

        /// JavaScript entry file
        #[arg(long, default_value = "index.js")]
        entry_file: String,

        /// Local output directory for the bundle
        #[arg(long, default_value = "./build")]
        build_dir: String,

        /// Encrypt the bundle with AES-256-GCM
        #[arg(short, long, default_value_t = false)]
        encrypt: bool,
    },

    /// Rollback to a previous version on a channel
    Rollback {
        /// Target platform
        #[arg(short, long)]
        platform: String,

        /// Version to roll back to
        #[arg(short, long)]
        version: String,

        /// Release channel
        #[arg(short, long, default_value = "production")]
        channel: String,
    },

    /// Generate Ed25519 signing keypair for bundle verification
    Keygen {
        /// Force overwrite existing keys
        #[arg(short, long, default_value_t = false)]
        force: bool,
    },

    /// Show current configuration and auth status
    Status,

    /// Manage encryption keys for bundle protection
    Keys {
        #[command(subcommand)]
        subcommand: KeyCommands,
    },

    /// Generate a standalone binary patch between two versions
    Patch {
        /// Base version (old)
        #[arg(short, long)]
        old: String,

        /// Target version (new)
        #[arg(short, long)]
        new: String,

        /// Release channel
        #[arg(short, long, default_value = "production")]
        channel: String,

        /// Optional output file path
        #[arg(short, long)]
        output: Option<String>,
    },
}

#[derive(Subcommand)]
pub enum KeyCommands {
    /// List all encryption keys in the keyring
    List,
    /// Generate a new encryption key and add it to the keyring
    Generate {
        /// Optional name/ID for the key
        #[arg(short, long)]
        id: Option<String>,
        /// Set as the active key for new releases
        #[arg(short, long, default_value_t = true)]
        active: bool,
    },
    /// Set an existing key as the active key
    Select {
        /// ID of the key to use
        id: String,
    },
    /// Remove a key from the keyring
    Remove {
        /// ID of the key to remove
        id: String,
    },
}

fn print_banner() {
    let banner = r#"
  ╔══════════════════════════════════════════╗
  ║                                          ║
  ║   ⚡  H O T P A T C H   C L I           ║
  ║       OTA for React Native               ║
  ║                                          ║
  ╚══════════════════════════════════════════╝
"#;
    println!("{}", banner.cyan());
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();

    match cli.command {
        Commands::Login => {
            print_banner();
            commands::login::execute().await?;
        }
        Commands::Release {
            platform,
            version,
            channel,
            mandatory,
            rollout,
            entry_file,
            build_dir,
            encrypt,
        } => {
            print_banner();
            commands::release::execute(
                &platform,
                &version,
                &channel,
                mandatory,
                rollout,
                &entry_file,
                &build_dir,
                encrypt,
            )
            .await?;
        }
        Commands::Rollback {
            platform,
            version,
            channel,
        } => {
            print_banner();
            commands::rollback::execute(&platform, &version, &channel).await?;
        }
        Commands::Keygen { force } => {
            print_banner();
            commands::keygen::execute(force)?;
        }
        Commands::Status => {
            print_banner();
            commands::status::execute()?;
        }
        Commands::Keys { subcommand } => {
            print_banner();
            commands::keys::execute(subcommand)?;
        }
        Commands::Patch { old, new, channel, output } => {
            print_banner();
            commands::patch::execute(&old, &new, &channel, output.as_deref()).await?;
        }
    }

    Ok(())
}
