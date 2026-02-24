use anyhow::{Context, Result};
use std::fs;
use std::io::Cursor;
use std::path::Path;

pub fn create_patch(old_path: &Path, new_path: &Path, patch_path: &Path) -> Result<()> {
    let old_data = fs::read(old_path)
        .with_context(|| format!("Failed to read old bundle: {}", old_path.display()))?;
    let new_data = fs::read(new_path)
        .with_context(|| format!("Failed to read new bundle: {}", new_path.display()))?;

    let mut patch_data = Vec::new();
    qbsdiff::Bsdiff::new(&old_data, &new_data)
        .compare(Cursor::new(&mut patch_data))
        .context("Failed to generate binary patch")?;

    fs::write(patch_path, patch_data)
        .with_context(|| format!("Failed to write patch file: {}", patch_path.display()))?;

    Ok(())
}
