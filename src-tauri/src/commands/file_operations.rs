// src-tauri/src/commands/file_operations.rs
// Commands for basic file and folder operations (create, rename, delete)

use std::fs;
use std::collections::HashSet;
use tauri::AppHandle;
use uuid::Uuid;
use super::{ProjectData, Node, utils::*};

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

#[tauri::command]
pub async fn sync_external_files(
    app: AppHandle,
    project_id: String,
) -> Result<Vec<Node>, String> {
    let project_dir = get_project_dir(&app, &project_id)?;
    
    if !project_dir.exists() {
        return Err("Project directory not found".to_string());
    }
    
    println!("🔄 Syncing external files for project: {}", project_id);
    
    // Load current project data to get existing nodes
    let projects_file = get_projects_file(&app)?;
    let existing_data: ProjectData = if projects_file.exists() {
        let content = safe_file_operation(
            || fs::read_to_string(&projects_file),
            "Failed to read projects file"
        )?;
        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse projects data: {}", e))?
    } else {
        ProjectData {
            projects: Vec::new(),
            nodes: Vec::new(),
            clients: Vec::new(),
        }
    };
    
    // Get existing file paths for this project
    let existing_paths: HashSet<String> = existing_data.nodes
        .iter()
        .filter(|node| node.project_id == project_id)
        .filter_map(|node| node.file_path.as_ref())
        .cloned()
        .collect();
    
    // Find the project root node
    let project_root = existing_data.nodes
        .iter()
        .find(|node| 
            node.project_id == project_id && 
            (node.hidden == Some(true) || node.name == "__PROJECT_ROOT__")
        );
    
    let root_id = match project_root {
        Some(root) => root.id.clone(),
        None => return Err("Project root not found".to_string()),
    };
    
    // Scan directory for new files
    let mut new_nodes = Vec::new();
    
    fn scan_directory(
        dir: &std::path::Path,
        parent_id: &str,
        project_id: &str,
        existing_paths: &HashSet<String>,
        new_nodes: &mut Vec<Node>,
        base_dir: &std::path::Path,
    ) -> Result<(), String> {
        let entries = safe_file_operation(
            || fs::read_dir(dir),
            "Failed to read directory"
        )?;
        
        for entry in entries {
            let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
            let path = entry.path();
            let file_name = path.file_name()
                .and_then(|name| name.to_str())
                .unwrap_or("unknown");
            
            // Skip hidden files and system files
            if file_name.starts_with('.') || file_name.starts_with('__') {
                continue;
            }
            
            // Get relative path from project root
            let relative_path = path.strip_prefix(base_dir)
                .map_err(|e| format!("Failed to get relative path: {}", e))?
                .to_string_lossy()
                .to_string();
            
            // Skip if we already track this file
            if existing_paths.contains(&relative_path) {
                continue;
            }
            
            let node_id = Uuid::new_v4().to_string();
            
            if path.is_dir() {
                // Create folder node
                let folder_node = Node {
                    id: node_id.clone(),
                    name: file_name.to_string(),
                    r#type: "folder".to_string(),
                    extension: None,
                    parent_id: Some(parent_id.to_string()),
                    project_id: project_id.to_string(),
                    hidden: Some(false),
                    file_path: Some(relative_path),
                    size: None,
                    modified: None,
                    is_binary: None,
                };
                
                new_nodes.push(folder_node);
                println!("📁 Found new folder: {}", relative_path);
                
                // Recursively scan subdirectory
                scan_directory(&path, &node_id, project_id, existing_paths, new_nodes, base_dir)?;
                
            } else if path.is_file() {
                // Create file node
                let extension = get_file_extension(&path);
                let is_binary = is_binary_file(&path);
                
                let metadata = safe_file_operation(
                    || fs::metadata(&path),
                    "Failed to get file metadata"
                )?;
                
                let modified = metadata.modified()
                    .map(|time| time.duration_since(std::time::UNIX_EPOCH)
                        .map(|duration| duration.as_secs() as i64)
                        .unwrap_or(0))
                    .unwrap_or(0);
                
                let file_node = Node {
                    id: node_id,
                    name: file_name.to_string(),
                    r#type: "file".to_string(),
                    extension,
                    parent_id: Some(parent_id.to_string()),
                    project_id: project_id.to_string(),
                    hidden: Some(false),
                    file_path: Some(relative_path.clone()),
                    size: Some(metadata.len()),
                    modified: Some(modified),
                    is_binary: Some(is_binary),
                };
                
                new_nodes.push(file_node);
                println!("📄 Found new file: {} ({} bytes, binary: {})", 
                         relative_path, metadata.len(), is_binary);
            }
        }
        
        Ok(())
    }
    
    // Scan the project directory
    scan_directory(&project_dir, &root_id, &project_id, &existing_paths, &mut new_nodes, &project_dir)?;
    
    // If we found new files, save them to the projects file
    if !new_nodes.is_empty() {
        let mut updated_data = existing_data;
        updated_data.nodes.extend(new_nodes.clone());
        
        let json = serde_json::to_string_pretty(&updated_data)
            .map_err(|e| format!("Failed to serialize updated data: {}", e))?;
        
        safe_file_operation(
            || fs::write(&projects_file, json),
            "Failed to write updated projects file"
        )?;
        
        println!("✅ Synced {} new files/folders to project database", new_nodes.len());
    } else {
        println!("✅ No new files found - project is already in sync");
    }
    
    Ok(new_nodes)
}

#[tauri::command]
pub async fn auto_sync_project_files(
    app: AppHandle,
    project_id: String,
) -> Result<bool, String> {
    match sync_external_files(app, project_id).await {
        Ok(new_nodes) => {
            println!("🔄 Auto-sync completed: {} new files found", new_nodes.len());
            Ok(new_nodes.len() > 0)
        }
        Err(e) => {
            println!("❌ Auto-sync failed: {}", e);
            Err(e)
        }
    }
}