// src-tauri/src/commands/content_management.rs
// Fixed version that handles proper file paths for reading/writing

use std::fs;
use tauri::AppHandle;
use super::{FileStats, ProjectData, utils::*};

// Helper function to resolve the actual file path on disk
fn resolve_file_path(
    app: &AppHandle,
    node_id: &str,
    file_path: &str,
    project_id: &str,
) -> Result<std::path::PathBuf, String> {
    let project_dir = get_project_dir(app, project_id)?;
    
    // If file_path is provided and not empty, use it directly
    if !file_path.is_empty() && file_path != "__PROJECT_ROOT__" {
        return Ok(project_dir.join(file_path));
    }
    
    // Otherwise, try to reconstruct the path from the node hierarchy
    let projects_file = get_projects_file(app)?;
    if !projects_file.exists() {
        return Err("Projects file not found".to_string());
    }
    
    let content = safe_file_operation(
        || fs::read_to_string(&projects_file),
        "Failed to read projects file"
    )?;
    
    let data: ProjectData = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse projects data: {}", e))?;
    
    // Find the node
    let node = data.nodes.iter()
        .find(|n| n.id == node_id)
        .ok_or_else(|| "Node not found".to_string())?;
    
    // Build path by traversing up the hierarchy
    let mut path_components = vec![node.name.clone()];
    let mut current_parent_id = node.parent_id.as_deref().unwrap_or("");
    
    loop {
        if current_parent_id.is_empty() || current_parent_id == "__PROJECT_ROOT__" {
            break;
        }
        
        // Find the parent node
        if let Some(parent_node) = data.nodes.iter().find(|n| n.id == current_parent_id) {
            if parent_node.hidden == Some(true) || parent_node.name == "__PROJECT_ROOT__" {
                break;
            }
            
            path_components.insert(0, parent_node.name.clone());
            current_parent_id = parent_node.parent_id.as_deref().unwrap_or("");
        } else {
            break;
        }
    }
    
    // Construct the full path
    let mut full_path = project_dir;
    for component in path_components {
        full_path = full_path.join(component);
    }
    
    Ok(full_path)
}

#[tauri::command]
pub async fn get_file_content(
    app: AppHandle, 
    node_id: String, 
    file_path: String, 
    project_id: String
) -> Result<String, String> {
    let full_path = resolve_file_path(&app, &node_id, &file_path, &project_id)?;
    
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
    let full_path = resolve_file_path(&app, &node_id, &file_path, &project_id)?;
    
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