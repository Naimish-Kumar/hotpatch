use anyhow::{Context, Result};
use colored::Colorize;
use std::process::Command;

/// Builds a React Native JavaScript bundle by shelling out to `npx react-native bundle`.
///
/// This produces the JS bundle and assets in the specified output directory.
///
/// # Arguments
/// * `platform` - "android" or "ios"
/// * `entry_file` - JS entry point (default: "index.js")
/// * `output_dir` - Directory to write the bundle and assets
pub fn build_bundle(platform: &str, entry_file: &str, output_dir: &str) -> Result<()> {
    println!(
        "{}",
        format!("  📦 Building {} bundle...", platform).cyan()
    );

    let bundle_output = match platform {
        "android" => format!("{}/index.android.bundle", output_dir),
        "ios" => format!("{}/main.jsbundle", output_dir),
        _ => anyhow::bail!("Unsupported platform: {}. Use 'android' or 'ios'.", platform),
    };

    // Ensure output directory exists
    std::fs::create_dir_all(output_dir)
        .with_context(|| format!("Failed to create build directory: {}", output_dir))?;

    // Run: npx react-native bundle
    let status = Command::new("npx")
        .args([
            "react-native",
            "bundle",
            "--platform",
            platform,
            "--dev",
            "false",
            "--entry-file",
            entry_file,
            "--bundle-output",
            &bundle_output,
            "--assets-dest",
            output_dir,
        ])
        .status()
        .context("Failed to run 'npx react-native bundle'. Is React Native installed?")?;

    if !status.success() {
        anyhow::bail!(
            "React Native bundle command failed with exit code: {:?}",
            status.code()
        );
    }

    println!(
        "{}",
        format!("  ✅ Bundle created at {}", bundle_output).green()
    );

    Ok(())
}
