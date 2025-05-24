// src-tauri/src/commands/mod.rs
// Main module file that re-exports all command modules - FIXED VERSION

pub mod types;
pub mod utils;
pub mod project_management;
pub mod file_operations;
pub mod content_management;
pub mod import_export;
pub mod dialogs;
pub mod execution;
pub mod utilities;
pub mod sync;

// Re-export all commands for easy access in main.rs
pub use project_management::*;
pub use file_operations::*;
pub use content_management::*;
pub use import_export::*;
pub use dialogs::*;
pub use execution::*;
pub use utilities::*;

// FIXED: Use glob import for sync module to get the __cmd__ macros
pub use sync::*;

// Re-export types for use in other modules
pub use types::*;