use anyhow::{Context, Result};
use bytesize::ByteSize;
use colored::Colorize;
use std::fs::File;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

/// Compresses the build directory into a ZIP archive, preserving directory structure.
///
/// Returns the path to the created ZIP file.
///
/// # Arguments
/// * `build_dir` - The directory containing the built bundle and assets
/// * `output_path` - Where to write the ZIP file (e.g., "./build/bundle.zip")
pub fn compress_bundle(build_dir: &str, output_path: &str) -> Result<PathBuf> {
    println!("{}", "  📁 Compressing bundle...".cyan());

    let zip_path = PathBuf::from(output_path);
    let file = File::create(&zip_path)
        .with_context(|| format!("Failed to create ZIP file at {}", output_path))?;

    let mut zip = ZipWriter::new(file);
    let options = SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .compression_level(Some(9)); // Maximum compression

    let build_path = Path::new(build_dir);
    let mut file_count: u64 = 0;
    let mut total_size: u64 = 0;

    for entry in WalkDir::new(build_dir) {
        let entry = entry.context("Failed to walk build directory")?;
        let path = entry.path();

        // Get the relative path within the build directory
        let relative_path = path
            .strip_prefix(build_path)
            .context("Failed to compute relative path")?;

        if relative_path.as_os_str().is_empty() {
            continue;
        }

        let path_str = relative_path.to_string_lossy().replace('\\', "/");

        if path.is_dir() {
            zip.add_directory(&path_str, options)
                .with_context(|| format!("Failed to add directory: {}", path_str))?;
        } else {
            zip.start_file(&path_str, options)
                .with_context(|| format!("Failed to start file: {}", path_str))?;

            let mut f = File::open(path)
                .with_context(|| format!("Failed to open: {}", path.display()))?;

            let mut buffer = Vec::new();
            f.read_to_end(&mut buffer)
                .with_context(|| format!("Failed to read: {}", path.display()))?;

            total_size += buffer.len() as u64;
            zip.write_all(&buffer)
                .with_context(|| format!("Failed to write: {}", path_str))?;

            file_count += 1;
        }
    }

    zip.finish().context("Failed to finalize ZIP archive")?;

    // Report compressed size
    let compressed_size = std::fs::metadata(&zip_path)
        .map(|m| m.len())
        .unwrap_or(0);

    let ratio = if total_size > 0 {
        ((1.0 - (compressed_size as f64 / total_size as f64)) * 100.0) as u64
    } else {
        0
    };

    println!(
        "{}",
        format!(
            "  ✅ Compressed {} files: {} → {} ({}% reduction)",
            file_count,
            ByteSize(total_size),
            ByteSize(compressed_size),
            ratio
        )
        .green()
    );

    Ok(zip_path)
}
