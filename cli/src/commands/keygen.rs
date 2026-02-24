use anyhow::Result;

use crate::signing;

/// Execute the `hotpatch keygen` command.
///
/// Generates a new Ed25519 signing keypair and stores it in ~/.hotpatch/.
pub fn execute(force: bool) -> Result<()> {
    signing::generate_keypair(force)
}
