// src-tauri/src/commands/file_operations.rs
// Commands for basic file and folder operations (create, rename, delete) - FIXED VERSION

use std::fs;
use tauri::AppHandle;
use uuid::Uuid;
use super::utils::*; // FIXED: Remove unused imports

#[tauri::command]
pub async fn create_folder(
    app: AppHandle,
    parent_id: String,
    name: String,
    project_id: String,
) -> Result<String, String> {
    let project_dir = get_project_dir(&app, &project_id)?;
    let folder_id = Uuid::new_v4().to_string();
    
    let folder_path = if parent_id.is_empty() || parent_id == "__PROJECT_ROOT__" {
        project_dir.join(&name)
    } else {
        project_dir.join(&name)
    };
    
    safe_file_operation(
        || fs::create_dir_all(&folder_path),
        "Failed to create folder"
    )?;
    
    println!("📁 Created folder: {:?}", folder_path);
    
    Ok(folder_id)
}

#[tauri::command]
pub async fn create_file(
    app: AppHandle,
    parent_id: String,
    name: String,
    project_id: String,
) -> Result<String, String> {
    let project_dir = get_project_dir(&app, &project_id)?;
    let file_id = Uuid::new_v4().to_string();
    
    safe_file_operation(
        || fs::create_dir_all(&project_dir),
        "Failed to create project directory"
    )?;
    
    let file_path = if parent_id.is_empty() || parent_id == "__PROJECT_ROOT__" {
        project_dir.join(&name)
    } else {
        project_dir.join(&name)
    };
    
    ensure_parent_dir(&file_path)
        .map_err(|e| format!("Failed to create parent directory: {}", e))?;
    
    let default_content = get_default_file_content(&name);
    safe_file_operation(
        || fs::write(&file_path, default_content),
        "Failed to create file"
    )?;
    
    println!("📄 Created file: {:?}", file_path);
    
    Ok(file_id)
}

#[tauri::command]
pub async fn rename_node(
    app: AppHandle, 
    node_id: String, 
    new_name: String, 
    file_path: String, 
    project_id: String
) -> Result<(), String> {
    let project_dir = get_project_dir(&app, &project_id)?;
    let old_path = project_dir.join(&file_path);
    let new_path = project_dir.join(&new_name);
    
    println!("✏️ Renaming: {:?} -> {:?} (node_id: {})", old_path, new_path, node_id);
    
    if old_path.exists() {
        ensure_parent_dir(&new_path)
            .map_err(|e| format!("Failed to create parent directory: {}", e))?;
        
        safe_file_operation(
            || fs::rename(&old_path, &new_path),
            "Failed to rename file/folder"
        )?;
        
        println!("✅ Renamed successfully: {:?} -> {:?}", old_path, new_path);
    } else {
        println!("⚠️ Original file/folder not found, skipping rename: {:?}", old_path);
    }
    
    Ok(())
}

#[tauri::command]
pub async fn delete_node(
    app: AppHandle, 
    node_id: String, 
    file_path: String, 
    project_id: String
) -> Result<(), String> {
    let project_dir = get_project_dir(&app, &project_id)?;
    let full_path = project_dir.join(&file_path);
    
    println!("🗑️ Deleting: {:?} (node_id: {})", full_path, node_id);
    
    if !full_path.exists() {
        println!("⚠️ File/folder not found, skipping deletion: {:?}", full_path);
        return Ok(());
    }
    
    if full_path.is_dir() {
        safe_file_operation(
            || fs::remove_dir_all(&full_path),
            "Failed to delete folder"
        )?;
    } else {
        safe_file_operation(
            || fs::remove_file(&full_path),
            "Failed to delete file"
        )?;
    }
    
    println!("✅ Deleted successfully: {:?}", full_path);
    Ok(())
}

// REMOVED: sync_external_files and auto_sync_project_files functions
// These are now only in src-tauri/src/commands/sync.rs