// src-tauri/src/commands/sync.rs - CORRECTED VERSION
// File sync commands to properly import externally created files

use std::fs;
use std::collections::HashSet;
use tauri::AppHandle;
use uuid::Uuid;
use super::{ProjectData, Node, utils::*};

#[tauri::command]
pub async fn sync_external_files(
    app: AppHandle,
    project_id: String,
) -> Result<Vec<Node>, String> {
    let project_dir = get_project_dir(&app, &project_id)?;
    
    if !project_dir.exists() {
        return Err("Project directory not found".to_string());
    }
    
    println!("🔄 SYNC: Starting sync for project: {}", project_id);
    println!("🔄 SYNC: Project directory: {:?}", project_dir);
    
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
    
    // Get existing file paths for this project (normalize to forward slashes)
    let existing_paths: HashSet<String> = existing_data.nodes
        .iter()
        .filter(|node| node.project_id == project_id)
        .filter_map(|node| node.file_path.as_ref())
        .map(|path| path.replace("\\", "/"))
        .collect();
    
    println!("🔄 SYNC: Found {} existing tracked files", existing_paths.len());
    for path in &existing_paths {
        println!("🔄 SYNC: Tracking: {}", path);
    }
    
    // Find the project root node
    let project_root = existing_data.nodes
        .iter()
        .find(|node| 
            node.project_id == project_id && 
            (node.hidden == Some(true) || node.name == "__PROJECT_ROOT__")
        );
    
    let root_id = match project_root {
        Some(root) => {
            println!("🔄 SYNC: Found project root: {}", root.id);
            root.id.clone()
        },
        None => {
            println!("❌ SYNC: Project root not found for project: {}", project_id);
            return Err("Project root not found".to_string());
        }
    };
    
    // Scan directory for new files
    let mut new_nodes = Vec::new();
    scan_directory_for_new_files(
        &project_dir,
        &root_id,
        &project_id,
        &existing_paths,
        &mut new_nodes,
        &project_dir,
    )?;
    
    println!("🔄 SYNC: Found {} new files to add", new_nodes.len());
    
    // If we found new files, save them to the projects file
    if !new_nodes.is_empty() {
        let mut updated_data = existing_data;
        
        // Add new nodes to the data
        for new_node in &new_nodes {
            println!("🔄 SYNC: Adding node: {} at path: {}", 
                     new_node.name, new_node.file_path.as_ref().unwrap_or(&"<no path>".to_string()));
        }
        
        updated_data.nodes.extend(new_nodes.clone());
        
        // Save updated data
        let json = serde_json::to_string_pretty(&updated_data)
            .map_err(|e| format!("Failed to serialize updated data: {}", e))?;
        
        safe_file_operation(
            || fs::write(&projects_file, json),
            "Failed to write updated projects file"
        )?;
        
        println!("✅ SYNC: Successfully added {} new files/folders to project database", new_nodes.len());
    } else {
        println!("✅ SYNC: No new files found - project is already in sync");
    }
    
    Ok(new_nodes)
}

fn scan_directory_for_new_files(
    dir: &std::path::Path,
    parent_id: &str,
    project_id: &str,
    existing_paths: &HashSet<String>,
    new_nodes: &mut Vec<Node>,
    base_dir: &std::path::Path,
) -> Result<(), String> {
    println!("🔍 SCAN: Scanning directory: {:?} (parent: {})", dir, parent_id);
    
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
        
        // Skip hidden files and special directories
        if file_name.starts_with('.') || file_name.starts_with("__") {
            println!("🔍 SCAN: Skipping hidden/special file: {}", file_name);
            continue;
        }
        
        // Get relative path from project root (normalize to forward slashes)
        let relative_path = path.strip_prefix(base_dir)
            .map_err(|e| format!("Failed to get relative path: {}", e))?
            .to_string_lossy()
            .to_string()
            .replace("\\", "/");
        
        println!("🔍 SCAN: Found item: {} -> relative path: {}", file_name, relative_path);
        
        // Skip if we already track this file
        if existing_paths.contains(&relative_path) {
            println!("🔍 SCAN: Already tracking: {}", relative_path);
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
                file_path: Some(relative_path.clone()),
                size: None,
                modified: None,
                is_binary: None,
            };
            
            new_nodes.push(folder_node);
            println!("📁 SCAN: Found new folder: {} -> {}", file_name, relative_path);
            
            // Recursively scan subdirectory
            scan_directory_for_new_files(&path, &node_id, project_id, existing_paths, new_nodes, base_dir)?;
            
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
            println!("📄 SCAN: Found new file: {} -> {} ({} bytes, binary: {})", 
                     file_name, relative_path, metadata.len(), is_binary);
        }
    }
    
    Ok(())
}

#[tauri::command]
pub async fn auto_sync_project_files(
    app: AppHandle,
    project_id: String,
) -> Result<bool, String> {
    println!("🔄 AUTO-SYNC: Starting for project: {}", project_id);
    
    match sync_external_files(app, project_id.clone()).await {
        Ok(new_nodes) => {
            println!("✅ AUTO-SYNC: Completed for project {}: {} new files found", 
                     project_id, new_nodes.len());
            Ok(new_nodes.len() > 0)
        }
        Err(e) => {
            println!("❌ AUTO-SYNC: Failed for project {}: {}", project_id, e);
            Err(e)
        }
    }
}

// Additional command to force rebuild the entire file tree from disk
#[tauri::command]
pub async fn rebuild_project_tree(
    app: AppHandle,
    project_id: String,
) -> Result<Vec<Node>, String> {
    println!("🔨 REBUILD: Starting complete rebuild for project: {}", project_id);
    
    let project_dir = get_project_dir(&app, &project_id)?;
    
    if !project_dir.exists() {
        return Err("Project directory not found".to_string());
    }
    
    // Load current project data
    let projects_file = get_projects_file(&app)?;
    let mut existing_data: ProjectData = if projects_file.exists() {
        let content = safe_file_operation(
            || fs::read_to_string(&projects_file),
            "Failed to read projects file"
        )?;
        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse projects data: {}", e))?
    } else {
        return Err("Projects file not found".to_string());
    };
    
    // Find the project root
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
    
    // Remove all existing nodes for this project (except the hidden root)
    existing_data.nodes.retain(|node| 
        node.project_id != project_id || 
        node.hidden == Some(true) || 
        node.name == "__PROJECT_ROOT__"
    );
    
    // Rebuild the entire tree from disk
    let mut new_nodes = Vec::new();
    let empty_paths = HashSet::new(); // No existing paths since we cleared them
    
    scan_directory_for_new_files(
        &project_dir,
        &root_id,
        &project_id,
        &empty_paths,
        &mut new_nodes,
        &project_dir,
    )?;
    
    // Add the new nodes
    existing_data.nodes.extend(new_nodes.clone());
    
    // Save updated data
    let json = serde_json::to_string_pretty(&existing_data)
        .map_err(|e| format!("Failed to serialize updated data: {}", e))?;
    
    safe_file_operation(
        || fs::write(&projects_file, json),
        "Failed to write updated projects file"
    )?;
    
    println!("✅ REBUILD: Successfully rebuilt tree with {} nodes", new_nodes.len());
    
    Ok(new_nodes)
}