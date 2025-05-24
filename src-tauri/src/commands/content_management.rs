// src-tauri/src/commands/content_management.rs
// Commands for file content and metadata operations - FIXED VERSION

use std::fs;
use tauri::AppHandle;
use super::{FileStats, utils::*};

#[tauri::command]
pub async fn get_file_content(
    app: AppHandle, 
    node_id: String, 
    file_path: String, 
    project_id: String
) -> Result<String, String> {
    let project_dir = get_project_dir(&app, &project_id)?;
    let full_path = project_dir.join(&file_path);
    
    println!("📖 Reading file: {:?} (node_id: {})", full_path, node_id);
    
    if !full_path.exists() {
        println!("⚠️ File not found: {:?}", full_path);
        return Ok(String::new());
    }
    
    // Check if file is binary based on extension first
    if is_binary_file(&full_path) {
        println!("📋 Binary file detected by extension: {:?}", full_path);
        return Ok("[Binary file - content not displayable]".to_string());
    }
    
    // Try to read as bytes first to check for binary content
    let bytes = safe_file_operation(
        || fs::read(&full_path),
        "Failed to read file bytes"
    )?;
    
    // Check if content is binary
    if is_content_binary(&bytes) {
        println!("📋 Binary content detected: {:?}", full_path);
        return Ok("[Binary file - content not displayable]".to_string());
    }
    
    // Convert bytes to string if it's text content
    match String::from_utf8(bytes) {
        Ok(content) => {
            println!("📄 Successfully read text file: {:?} ({} chars)", full_path, content.len());
            Ok(content)
        }
        Err(_) => {
            println!("📋 UTF-8 conversion failed, treating as binary: {:?}", full_path);
            Ok("[Binary file - content not displayable]".to_string())
        }
    }
}

#[tauri::command]
pub async fn save_file_content(
    app: AppHandle,
    node_id: String,
    content: String,
    file_path: String,
    project_id: String,
) -> Result<(), String> {
    let project_dir = get_project_dir(&app, &project_id)?;
    let full_path = project_dir.join(&file_path);
    
    println!("💾 Saving file: {:?} (node_id: {}, {} bytes)", full_path, node_id, content.len());
    
    // Don't allow saving to binary files
    if is_binary_file(&full_path) {
        return Err("Cannot save content to binary file".to_string());
    }
    
    ensure_parent_dir(&full_path)
        .map_err(|e| format!("Failed to create parent directory: {}", e))?;
    
    safe_file_operation(
        || fs::write(&full_path, &content),
        "Failed to write file"
    )?;
    
    println!("✅ File saved successfully: {:?}", full_path);
    Ok(())
}

#[tauri::command]
pub async fn get_file_stats(
    app: AppHandle,
    project_id: String,
    file_path: String,
) -> Result<FileStats, String> {
    let project_dir = get_project_dir(&app, &project_id)?;
    let full_path = project_dir.join(&file_path);
    
    if !full_path.exists() {
        return Err("File not found".to_string());
    }
    
    let metadata = safe_file_operation(
        || fs::metadata(&full_path),
        "Failed to get file metadata"
    )?;
    
    let modified = metadata.modified()
        .map_err(|e| format!("Failed to get modified time: {}", e))?
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| format!("Invalid modified time: {}", e))?
        .as_secs() as i64;
    
    let created = metadata.created()
        .unwrap_or_else(|_| metadata.modified().unwrap_or(std::time::SystemTime::UNIX_EPOCH))
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| format!("Invalid created time: {}", e))?
        .as_secs() as i64;
    
    let is_binary = is_binary_file(&full_path);
    let file_type = get_file_type_description(&full_path);
    
    Ok(FileStats {
        size: metadata.len(),
        modified,
        created,
        is_binary,
        file_type,
    })
}