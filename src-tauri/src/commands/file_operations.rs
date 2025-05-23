// src-tauri/src/commands/file_operations.rs
// COMPLETELY FIXED VERSION

use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use uuid::Uuid;
use super::{ProjectData, utils::*};

// Helper function to build the full path based on node hierarchy
fn build_node_path(
    app: &AppHandle,
    parent_id: &str,
    project_id: &str,
    name: &str,
) -> Result<PathBuf, String> {
    let project_dir = get_project_dir(app, project_id)?;
    
    if parent_id.is_empty() || parent_id == "__PROJECT_ROOT__" {
        // File/folder goes in project root
        return Ok(project_dir.join(name));
    }
    
    // Load current project data to traverse the hierarchy
    let projects_file = get_projects_file(app)?;
    if !projects_file.exists() {
        return Ok(project_dir.join(name));
    }
    
    let content = safe_file_operation(
        || fs::read_to_string(&projects_file),
        "Failed to read projects file"
    )?;
    
    let data: ProjectData = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse projects data: {}", e))?;
    
    // Build path by traversing up the hierarchy
    let mut path_components = vec![name.to_string()];
    let mut current_parent_id = parent_id;
    
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
pub async fn create_folder(
    app: AppHandle,
    parent_id: String,
    name: String,
    project_id: String,
) -> Result<String, String> {
    let folder_id = Uuid::new_v4().to_string();
    
    println!("📁 Creating folder '{}' in parent '{}' for project '{}'", name, parent_id, project_id);
    
    // Build the full path respecting the hierarchy
    let folder_path = build_node_path(&app, &parent_id, &project_id, &name)?;
    
    println!("📁 Full folder path: {:?}", folder_path);
    
    // Create the directory
    safe_file_operation(
        || fs::create_dir_all(&folder_path),
        "Failed to create folder"
    )?;
    
    println!("✅ Created folder: {:?}", folder_path);
    
    Ok(folder_id)
}

#[tauri::command]
pub async fn create_file(
    app: AppHandle,
    parent_id: String,
    name: String,
    project_id: String,
) -> Result<String, String> {
    let file_id = Uuid::new_v4().to_string();
    
    println!("📄 Creating file '{}' in parent '{}' for project '{}'", name, parent_id, project_id);
    
    // Build the full path respecting the hierarchy
    let file_path = build_node_path(&app, &parent_id, &project_id, &name)?;
    
    println!("📄 Full file path: {:?}", file_path);
    
    // Ensure parent directory exists
    ensure_parent_dir(&file_path)
        .map_err(|e| format!("Failed to create parent directory: {}", e))?;
    
    // Create the file with default content
    let default_content = get_default_file_content(&name);
    safe_file_operation(
        || fs::write(&file_path, default_content),
        "Failed to create file"
    )?;
    
    println!("✅ Created file: {:?}", file_path);
    
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
    println!("✏️ Renaming node '{}': '{}' -> '{}'", node_id, file_path, new_name);
    
    // Load project data to find the node and build proper paths
    let projects_file = get_projects_file(&app)?;
    if !projects_file.exists() {
        return Err("Projects file not found".to_string());
    }
    
    let content = safe_file_operation(
        || fs::read_to_string(&projects_file),
        "Failed to read projects file"
    )?;
    
    let data: ProjectData = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse projects data: {}", e))?;
    
    // Find the node being renamed
    let node = data.nodes.iter()
        .find(|n| n.id == node_id)
        .ok_or_else(|| "Node not found".to_string())?;
    
    let project_dir = get_project_dir(&app, &project_id)?;
    
    // Build old path from current file_path
    let old_path = if file_path.is_empty() || file_path == node.name {
        project_dir.join(&node.name)
    } else {
        project_dir.join(&file_path)
    };
    
    // Build new path with same parent but new name
    let parent_id = node.parent_id.as_deref().unwrap_or("");
    let new_path = build_node_path(&app, parent_id, &project_id, &new_name)?;
    
    println!("✏️ Rename paths: {:?} -> {:?}", old_path, new_path);
    
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

// COMPLETELY FIXED delete_node command
#[tauri::command]
pub async fn delete_node(
    app: AppHandle,
    node_id: String,
    file_path: String,
    project_id: String,
) -> Result<(), String> {
    println!("🗑️ FIXED: Deleting node ID: {}, path: {}, project: {}", node_id, file_path, project_id);

    // Get the project directory
    let project_dir = get_project_dir(&app, &project_id)?;
    
    // Build the full path within the project directory
    let full_path = if file_path.is_empty() {
        // If no file_path provided, try to get it from the database
        let projects_file = get_projects_file(&app)?;
        if projects_file.exists() {
            let content = safe_file_operation(
                || fs::read_to_string(&projects_file),
                "Failed to read projects file"
            )?;
            
            let data: ProjectData = serde_json::from_str(&content)
                .map_err(|e| format!("Failed to parse projects data: {}", e))?;
            
            // Find the node to get its path
            if let Some(node) = data.nodes.iter().find(|n| n.id == node_id) {
                if let Some(path) = &node.file_path {
                    project_dir.join(path)
                } else {
                    project_dir.join(&node.name)
                }
            } else {
                println!("⚠️ Node not found in database: {}", node_id);
                return Ok(()); // Don't fail if node not in DB
            }
        } else {
            println!("⚠️ Projects file not found");
            return Ok(()); // Don't fail if no projects file
        }
    } else {
        // Use the provided file_path
        project_dir.join(&file_path)
    };

    println!("🗑️ FIXED: Full path to delete: {:?}", full_path);

    if !full_path.exists() {
        println!("⚠️ FIXED: File/folder not found on disk: {:?}", full_path);
        // Don't return an error - the file might already be deleted
        return Ok(());
    }

    // Delete the file or folder
    if full_path.is_dir() {
        safe_file_operation(
            || fs::remove_dir_all(&full_path),
            "Failed to delete folder"
        )?;
        println!("✅ FIXED: Folder deleted: {:?}", full_path);
    } else {
        safe_file_operation(
            || fs::remove_file(&full_path),
            "Failed to delete file"
        )?;
        println!("✅ FIXED: File deleted: {:?}", full_path);
    }

    Ok(())
}

// Add a new command to delete entire project directories
#[tauri::command]
pub async fn delete_project_directory(
    app: AppHandle,
    project_id: String,
) -> Result<(), String> {
    println!("🗑️ FIXED: Deleting entire project directory for: {}", project_id);
    
    let project_dir = get_project_dir(&app, &project_id)?;
    
    if project_dir.exists() {
        safe_file_operation(
            || fs::remove_dir_all(&project_dir),
            "Failed to delete project directory"
        )?;
        println!("✅ FIXED: Project directory deleted: {:?}", project_dir);
    } else {
        println!("⚠️ FIXED: Project directory not found: {:?}", project_dir);
    }
    
    Ok(())
}