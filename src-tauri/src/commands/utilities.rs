// src-tauri/src/commands/utilities.rs
// Utility commands for debugging, maintenance, and project management

use std::fs;
use std::path::Path;
use tauri::AppHandle;
use super::utils::*;

#[tauri::command]
pub async fn validate_project_structure(
    app: AppHandle,
    project_id: String,
) -> Result<bool, String> {
    let project_dir = get_project_dir(&app, &project_id)?;
    
    if !project_dir.exists() {
        println!("⚠️ Project directory does not exist: {:?}", project_dir);
        return Ok(false);
    }
    
    println!("✅ Project directory exists: {:?}", project_dir);
    Ok(true)
}

#[tauri::command]
pub async fn cleanup_orphaned_files(
    app: AppHandle,
    project_id: String,
) -> Result<Vec<String>, String> {
    let project_dir = get_project_dir(&app, &project_id)?;
    let orphaned_files = Vec::new();
    
    if !project_dir.exists() {
        return Ok(orphaned_files);
    }
    
    println!("🧹 Cleanup check for project: {}", project_id);
    
    // TODO: Implement actual orphan detection logic
    // This would compare files on disk vs. nodes in the database
    // and identify files that exist on disk but not in the node tree
    
    Ok(orphaned_files)
}

#[tauri::command]
pub async fn get_project_size(
    app: AppHandle,
    project_id: String,
) -> Result<u64, String> {
    let project_dir = get_project_dir(&app, &project_id)?;
    
    if !project_dir.exists() {
        return Ok(0);
    }
    
    fn calculate_dir_size(path: &Path) -> Result<u64, std::io::Error> {
        let mut total_size = 0;
        
        for entry in fs::read_dir(path)? {
            let entry = entry?;
            let path = entry.path();
            
            if path.is_dir() {
                total_size += calculate_dir_size(&path)?;
            } else {
                if let Ok(metadata) = fs::metadata(&path) {
                    total_size += metadata.len();
                }
            }
        }
        
        Ok(total_size)
    }
    
    let size = calculate_dir_size(&project_dir)
        .map_err(|e| format!("Failed to calculate project size: {}", e))?;
    
    println!("📊 Project {} size: {} bytes", project_id, size);
    Ok(size)
}

#[tauri::command]
pub async fn get_app_info(app: AppHandle) -> Result<serde_json::Value, String> {
    let app_data_dir = get_app_data_dir(&app)?;
    let files_dir = get_files_dir(&app)?;
    
    let info = serde_json::json!({
        "app_data_dir": app_data_dir.to_string_lossy(),
        "files_dir": files_dir.to_string_lossy(),
        "app_data_exists": app_data_dir.exists(),
        "files_dir_exists": files_dir.exists(),
    });
    
    Ok(info)
}

#[tauri::command]
pub async fn backup_projects(app: AppHandle) -> Result<String, String> {
    let projects_file = get_projects_file(&app)?;
    
    if !projects_file.exists() {
        return Err("No projects file to backup".to_string());
    }
    
    let backup_name = format!(
        "projects_backup_{}.json", 
        chrono::Utc::now().format("%Y%m%d_%H%M%S")
    );
    let backup_path = get_app_data_dir(&app)?.join(&backup_name);
    
    safe_file_operation(
        || fs::copy(&projects_file, &backup_path),
        "Failed to create backup"
    )?;
    
    println!("💾 Created backup: {:?}", backup_path);
    Ok(backup_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn restore_projects_backup(
    app: AppHandle, 
    backup_path: String
) -> Result<(), String> {
    let backup = Path::new(&backup_path);
    let projects_file = get_projects_file(&app)?;
    
    if !backup.exists() {
        return Err("Backup file does not exist".to_string());
    }
    
    // Validate backup file format
    let content = safe_file_operation(
        || fs::read_to_string(backup),
        "Failed to read backup file"
    )?;
    
    serde_json::from_str::<super::ProjectData>(&content)
        .map_err(|e| format!("Invalid backup file format: {}", e))?;
    
    // Create backup of current file before restore
    if projects_file.exists() {
        let current_backup = format!(
            "projects_pre_restore_{}.json", 
            chrono::Utc::now().format("%Y%m%d_%H%M%S")
        );
        let current_backup_path = get_app_data_dir(&app)?.join(&current_backup);
        
        safe_file_operation(
            || fs::copy(&projects_file, &current_backup_path),
            "Failed to backup current projects file"
        )?;
        
        println!("💾 Backed up current projects to: {:?}", current_backup_path);
    }
    
    // Restore from backup
    safe_file_operation(
        || fs::copy(backup, &projects_file),
        "Failed to restore backup"
    )?;
    
    println!("🔄 Restored projects from backup: {:?}", backup);
    Ok(())
}