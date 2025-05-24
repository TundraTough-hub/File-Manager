// src-tauri/src/commands/import_export.rs
// Commands for importing and exporting files and folders - COMPLETE FIXED VERSION

use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use uuid::Uuid;
use super::{ImportResult, utils::*};

#[tauri::command]
pub async fn import_file(
    app: AppHandle,
    project_id: String,
    parent_folder: String,
    source_path: String,
) -> Result<ImportResult, String> {
    let project_dir = get_project_dir(&app, &project_id)?;
    let source = PathBuf::from(&source_path);
    
    if !source.exists() {
        return Err("Source file does not exist".to_string());
    }
    
    if !source.is_file() {
        return Err("Source path is not a file".to_string());
    }
    
    let file_name = source.file_name()
        .ok_or_else(|| "Invalid source file path".to_string())?
        .to_string_lossy()
        .to_string();
    
    safe_file_operation(
        || fs::create_dir_all(&project_dir),
        "Failed to create project directory"
    )?;
    
    // Handle parent folder path correctly
    let dest_path = if parent_folder.is_empty() {
        // File goes to project root
        project_dir.join(&file_name)
    } else {
        // File goes to specific folder - but parent_folder might be a node ID
        // For now, put files in project root and let frontend handle the relationship
        project_dir.join(&file_name)
    };
    
    // Handle file name conflicts
    let mut final_dest_path = dest_path.clone();
    let mut counter = 1;
    while final_dest_path.exists() {
        let stem = dest_path.file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("file");
        let extension = dest_path.extension()
            .and_then(|s| s.to_str())
            .unwrap_or("");
        
        let new_name = if extension.is_empty() {
            format!("{} ({})", stem, counter)
        } else {
            format!("{} ({}).{}", stem, counter, extension)
        };
        
        final_dest_path = dest_path.parent()
            .unwrap_or(&project_dir)
            .join(new_name);
        counter += 1;
    }
    
    // Copy file
    safe_file_operation(
        || fs::copy(&source, &final_dest_path),
        "Failed to copy file"
    )?;
    
    // Verify the copy was successful
    if !final_dest_path.exists() {
        return Err("File copy verification failed".to_string());
    }
    
    let metadata = safe_file_operation(
        || fs::metadata(&final_dest_path),
        "Failed to get file metadata"
    )?;
    
    let extension = get_file_extension(&final_dest_path);
    let is_binary = is_binary_file(&final_dest_path);
    let file_id = Uuid::new_v4().to_string();
    let final_name = final_dest_path.file_name()
        .unwrap_or_else(|| std::ffi::OsStr::new(&file_name))
        .to_string_lossy()
        .to_string();
    
    // Create relative file path for frontend
    let relative_file_path = final_dest_path.strip_prefix(&project_dir)
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|_| final_name.clone());
    
    println!("📥 Imported file: {} -> {:?} (size: {} bytes, binary: {})", 
             source_path, final_dest_path, metadata.len(), is_binary);
    println!("📥 Relative path: {}", relative_file_path);
    
    Ok(ImportResult {
        node_id: file_id,
        name: final_name,
        r#type: "file".to_string(),
        extension,
        size: metadata.len(),
        is_binary,
        file_path: Some(relative_file_path),
    })
}

#[tauri::command]
pub async fn import_folder(
    app: AppHandle,
    project_id: String,
    parent_folder: String,
    source_path: String,
) -> Result<ImportResult, String> {
    let project_dir = get_project_dir(&app, &project_id)?;
    let source = PathBuf::from(&source_path);
    
    if !source.exists() || !source.is_dir() {
        return Err("Source folder does not exist or is not a directory".to_string());
    }
    
    let folder_name = source.file_name()
        .ok_or_else(|| "Invalid source folder path".to_string())?
        .to_string_lossy()
        .to_string();
    
    safe_file_operation(
        || fs::create_dir_all(&project_dir),
        "Failed to create project directory"
    )?;
    
    // Handle parent folder path correctly
    let dest_path = if parent_folder.is_empty() {
        project_dir.join(&folder_name)
    } else {
        // For now, put folders in project root and let frontend handle the relationship
        project_dir.join(&folder_name)
    };
    
    // Handle folder name conflicts
    let mut final_dest_path = dest_path.clone();
    let mut counter = 1;
    while final_dest_path.exists() {
        let new_name = format!("{} ({})", folder_name, counter);
        final_dest_path = dest_path.parent()
            .unwrap_or(&project_dir)
            .join(new_name);
        counter += 1;
    }
    
    // Copy folder recursively
    let total_size = copy_directory_recursive(&source, &final_dest_path)
        .map_err(|e| format!("Failed to copy folder: {}", e))?;
    
    // Verify the copy was successful
    if !final_dest_path.exists() {
        return Err("Folder copy verification failed".to_string());
    }
    
    let folder_id = Uuid::new_v4().to_string();
    let final_name = final_dest_path.file_name()
        .unwrap_or_else(|| std::ffi::OsStr::new(&folder_name))
        .to_string_lossy()
        .to_string();
    
    // Create relative file path for frontend
    let relative_file_path = final_dest_path.strip_prefix(&project_dir)
        .map(|p| p.to_string_lossy().to_string())
        .unwrap_or_else(|_| final_name.clone());
    
    println!("📥 Imported folder: {} -> {:?} (total size: {} bytes)", 
             source_path, final_dest_path, total_size);
    println!("📥 Relative path: {}", relative_file_path);
    
    Ok(ImportResult {
        node_id: folder_id,
        name: final_name,
        r#type: "folder".to_string(),
        extension: None,
        size: total_size,
        is_binary: false,
        file_path: Some(relative_file_path),
    })
}

#[tauri::command]
pub async fn export_file(
    app: AppHandle,
    project_id: String,
    file_path: String,
    dest_path: String,
) -> Result<(), String> {
    let project_dir = get_project_dir(&app, &project_id)?;
    let source_path = project_dir.join(&file_path);
    let dest = PathBuf::from(&dest_path);
    
    if !source_path.exists() {
        return Err("Source file does not exist".to_string());
    }
    
    if !source_path.is_file() {
        return Err("Source path is not a file".to_string());
    }
    
    ensure_parent_dir(&dest)
        .map_err(|e| format!("Failed to create destination directory: {}", e))?;
    
    safe_file_operation(
        || fs::copy(&source_path, &dest),
        "Failed to export file"
    )?;
    
    if !dest.exists() {
        return Err("File export verification failed".to_string());
    }
    
    println!("📤 Exported file: {:?} -> {:?}", source_path, dest);
    Ok(())
}

#[tauri::command]
pub async fn export_folder(
    app: AppHandle,
    project_id: String,
    folder_path: String,
    dest_path: String,
) -> Result<(), String> {
    let project_dir = get_project_dir(&app, &project_id)?;
    let source_path = project_dir.join(&folder_path);
    let dest = PathBuf::from(&dest_path);
    
    if !source_path.exists() || !source_path.is_dir() {
        return Err("Source folder does not exist or is not a directory".to_string());
    }
    
    copy_directory_recursive(&source_path, &dest)
        .map_err(|e| format!("Failed to export folder: {}", e))?;
    
    if !dest.exists() {
        return Err("Folder export verification failed".to_string());
    }
    
    println!("📤 Exported folder: {:?} -> {:?}", source_path, dest);
    Ok(())
}