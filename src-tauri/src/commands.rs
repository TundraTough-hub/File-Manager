// src-tauri/src/commands.rs - Complete enhanced version with binary file support
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{api::dialog, AppHandle};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectData {
    pub projects: Vec<Project>,
    pub nodes: Vec<Node>,
    pub clients: Vec<Client>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub root_id: Option<String>,
    pub client_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Node {
    pub id: String,
    pub name: String,
    pub r#type: String, // "file" or "folder"
    pub extension: Option<String>,
    pub parent_id: Option<String>,
    pub project_id: String,
    pub hidden: Option<bool>,
    pub file_path: Option<String>, // Relative path within project
    pub size: Option<u64>,
    pub modified: Option<i64>,
    pub is_binary: Option<bool>, // New field to track binary files
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Client {
    pub id: String,
    pub name: String,
    pub projects: Vec<String>,
    pub color: Option<ClientColor>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClientColor {
    pub name: String,
    pub value: String,
    pub bg: String,
    pub dark: String,
}

#[derive(Debug, Serialize)]
pub struct FileStats {
    pub size: u64,
    pub modified: i64,
    pub created: i64,
    pub is_binary: bool,
    pub file_type: String,
}

#[derive(Debug, Serialize)]
pub struct ImportResult {
    pub node_id: String,
    pub name: String,
    pub r#type: String,
    pub extension: Option<String>,
    pub size: u64,
    pub is_binary: bool,
}

// Helper functions
fn get_app_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path_resolver()
        .app_data_dir()
        .ok_or_else(|| "Failed to get app data directory".to_string())
}

fn get_files_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(get_app_data_dir(app)?.join("files"))
}

fn get_project_dir(app: &AppHandle, project_id: &str) -> Result<PathBuf, String> {
    Ok(get_files_dir(app)?.join(project_id))
}

fn get_projects_file(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(get_app_data_dir(app)?.join("projects.json"))
}

fn get_file_extension(path: &Path) -> Option<String> {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.to_lowercase())
}

// Determine if a file is binary based on extension
fn is_binary_file(path: &Path) -> bool {
    if let Some(extension) = get_file_extension(path) {
        matches!(extension.as_str(),
            // Documents
            "pdf" | "doc" | "docx" | "xls" | "xlsx" | "ppt" | "pptx" | "odt" | "ods" | "odp" |
            // Images
            "jpg" | "jpeg" | "png" | "gif" | "bmp" | "tiff" | "tif" | "svg" | "ico" | "webp" |
            // Audio
            "mp3" | "wav" | "flac" | "ogg" | "aac" | "m4a" | "wma" |
            // Video
            "mp4" | "avi" | "mov" | "wmv" | "flv" | "webm" | "mkv" | "m4v" |
            // Archives
            "zip" | "rar" | "7z" | "tar" | "gz" | "bz2" | "xz" |
            // Executables
            "exe" | "dll" | "so" | "dylib" | "bin" |
            // Other binary
            "dat" | "db" | "sqlite" | "sqlite3"
        )
    } else {
        false
    }
}

// Detect if file content is binary by checking for null bytes
fn is_content_binary(content: &[u8]) -> bool {
    // Check first 8192 bytes for null bytes (common indicator of binary content)
    let check_length = std::cmp::min(content.len(), 8192);
    content[..check_length].contains(&0)
}

fn get_file_type_description(path: &Path) -> String {
    if let Some(extension) = get_file_extension(path) {
        match extension.as_str() {
            // Documents
            "pdf" => "PDF Document".to_string(),
            "doc" => "Word Document".to_string(),
            "docx" => "Word Document".to_string(),
            "xls" => "Excel Spreadsheet".to_string(),
            "xlsx" => "Excel Spreadsheet".to_string(),
            "ppt" => "PowerPoint Presentation".to_string(),
            "pptx" => "PowerPoint Presentation".to_string(),
            
            // Code
            "py" => "Python Script".to_string(),
            "js" => "JavaScript File".to_string(),
            "html" => "HTML File".to_string(),
            "css" => "CSS Stylesheet".to_string(),
            "json" => "JSON Data".to_string(),
            
            // Text
            "txt" => "Text File".to_string(),
            "md" => "Markdown File".to_string(),
            "csv" => "CSV Data".to_string(),
            
            // Images
            "jpg" | "jpeg" => "JPEG Image".to_string(),
            "png" => "PNG Image".to_string(),
            "gif" => "GIF Image".to_string(),
            "svg" => "SVG Image".to_string(),
            
            // Archives
            "zip" => "ZIP Archive".to_string(),
            "rar" => "RAR Archive".to_string(),
            "7z" => "7-Zip Archive".to_string(),
            
            _ => format!("{} File", extension.to_uppercase()),
        }
    } else {
        "Unknown File".to_string()
    }
}

fn copy_directory_recursive(src: &Path, dst: &Path) -> Result<u64, std::io::Error> {
    let mut total_size = 0;
    fs::create_dir_all(dst)?;
    
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        
        if src_path.is_dir() {
            total_size += copy_directory_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
            if let Ok(metadata) = fs::metadata(&dst_path) {
                total_size += metadata.len();
            }
        }
    }
    
    Ok(total_size)
}

fn ensure_parent_dir(path: &Path) -> Result<(), std::io::Error> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    Ok(())
}

fn safe_file_operation<F, T>(operation: F, operation_name: &str) -> Result<T, String>
where
    F: FnOnce() -> Result<T, std::io::Error>,
{
    operation().map_err(|e| format!("{}: {}", operation_name, e))
}

// File dialog commands
#[tauri::command]
pub async fn show_file_dialog() -> Result<Option<String>, String> {
    let result = dialog::blocking::FileDialogBuilder::new()
        .add_filter("All Files", &["*"])
        .add_filter("Data Files", &["csv", "xlsx", "xls", "json", "xml"])
        .add_filter("Python Files", &["py", "ipynb"])
        .add_filter("Documents", &["pdf", "doc", "docx", "txt", "md"])
        .add_filter("Images", &["jpg", "jpeg", "png", "gif", "svg"])
        .add_filter("Archives", &["zip", "tar", "gz", "7z"])
        .pick_file();
    
    Ok(result.map(|path| path.to_string_lossy().to_string()))
}

#[tauri::command]
pub async fn show_folder_dialog() -> Result<Option<String>, String> {
    let result = dialog::blocking::FileDialogBuilder::new()
        .pick_folder();
    
    Ok(result.map(|path| path.to_string_lossy().to_string()))
}

#[tauri::command]
pub async fn show_save_dialog(default_name: String) -> Result<Option<String>, String> {
    let result = dialog::blocking::FileDialogBuilder::new()
        .set_file_name(&default_name)
        .save_file();
    
    Ok(result.map(|path| path.to_string_lossy().to_string()))
}

// Project data management
#[tauri::command]
pub async fn load_projects(app: AppHandle) -> Result<ProjectData, String> {
    let projects_file = get_projects_file(&app)?;
    
    if !projects_file.exists() {
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
}!("📄 No projects file found, returning empty data");
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

// Enhanced file operations
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

fn get_default_file_content(filename: &str) -> &'static str {
    let extension = Path::new(filename)
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_lowercase();
    
    match extension.as_str() {
        "py" => "# Python script\n\ndef main():\n    print(\"Hello, World!\")\n\nif __name__ == \"__main__\":\n    main()\n",
        "js" => "// JavaScript file\nconsole.log('Hello, World!');\n",
        "md" => "# Document Title\n\nYour content here...\n",
        "txt" => "Your text content here...\n",
        "json" => "{\n  \"example\": \"data\"\n}\n",
        "html" => "<!DOCTYPE html>\n<html>\n<head>\n  <title>Document</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>\n",
        "css" => "/* CSS Styles */\nbody {\n  font-family: Arial, sans-serif;\n}\n",
        _ => "",
    }
}

// Enhanced file content handling with binary support
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
    file_path: String,
    project_id: String,
    content: String,
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

// Enhanced import with binary file support
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
    
    let dest_path = if parent_folder.is_empty() {
        project_dir.join(&file_name)
    } else {
        let parent_dir = project_dir.join(&parent_folder);
        safe_file_operation(
            || fs::create_dir_all(&parent_dir),
            "Failed to create parent directory"
        )?;
        parent_dir.join(&file_name)
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
    
    println!("📥 Imported file: {} -> {:?} (size: {} bytes, binary: {})", 
             source_path, final_dest_path, metadata.len(), is_binary);
    
    Ok(ImportResult {
        node_id: file_id,
        name: final_name,
        r#type: "file".to_string(),
        extension,
        size: metadata.len(),
        is_binary,
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
    
    let dest_path = if parent_folder.is_empty() {
        project_dir.join(&folder_name)
    } else {
        let parent_dir = project_dir.join(&parent_folder);
        safe_file_operation(
            || fs::create_dir_all(&parent_dir),
            "Failed to create parent directory"
        )?;
        parent_dir.join(&folder_name)
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
    
    println!("📥 Imported folder: {} -> {:?} (total size: {} bytes)", 
             source_path, final_dest_path, total_size);
    
    Ok(ImportResult {
        node_id: folder_id,
        name: final_name,
        r#type: "folder".to_string(),
        extension: None,
        size: total_size,
        is_binary: false,
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

// Utility commands for debugging and maintenance
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
    
    println
}