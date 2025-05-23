// src-tauri/src/commands/project_management.rs
// Commands for loading and saving project data

use std::fs;
use tauri::AppHandle;
use super::{ProjectData, utils::*};

#[tauri::command]
pub async fn load_projects(app: AppHandle) -> Result<ProjectData, String> {
    let projects_file = get_projects_file(&app)?;
    
    if !projects_file.exists() {
        println!("📄 No projects file found, returning empty data");
        return Ok(ProjectData {
            projects: Vec::new(),
            nodes: Vec::new(),
            clients: Vec::new(),
        });
    }
    
    let content = safe_file_operation(
        || fs::read_to_string(&projects_file),
        "Failed to read projects file"
    )?;
    
    let data: ProjectData = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse projects file: {}", e))?;
    
    println!("📋 Loaded {} projects, {} nodes, {} clients", 
             data.projects.len(), data.nodes.len(), data.clients.len());
    
    Ok(data)
}

#[tauri::command]
pub async fn save_projects(app: AppHandle, data: ProjectData) -> Result<(), String> {
    let projects_file = get_projects_file(&app)?;
    
    // Ensure app data directory exists
    let app_data_dir = get_app_data_dir(&app)?;
    safe_file_operation(
        || fs::create_dir_all(&app_data_dir),
        "Failed to create app data directory"
    )?;
    
    let json = serde_json::to_string_pretty(&data)
        .map_err(|e| format!("Failed to serialize projects: {}", e))?;
    
    safe_file_operation(
        || fs::write(&projects_file, json),
        "Failed to write projects file"
    )?;
    
    println!("💾 Saved {} projects, {} nodes, {} clients", 
             data.projects.len(), data.nodes.len(), data.clients.len());
    
    Ok(())
}