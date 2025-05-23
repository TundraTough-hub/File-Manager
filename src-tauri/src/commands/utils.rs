// src-tauri/src/commands/utils.rs
// Shared utility functions used across command modules

use std::fs;
use std::path::{Path, PathBuf};
use tauri::AppHandle;

// Path utilities
pub fn get_app_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path_resolver()
        .app_data_dir()
        .ok_or_else(|| "Failed to get app data directory".to_string())
}

pub fn get_files_dir(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(get_app_data_dir(app)?.join("files"))
}

pub fn get_project_dir(app: &AppHandle, project_id: &str) -> Result<PathBuf, String> {
    Ok(get_files_dir(app)?.join(project_id))
}

pub fn get_projects_file(app: &AppHandle) -> Result<PathBuf, String> {
    Ok(get_app_data_dir(app)?.join("projects.json"))
}

// File utilities
pub fn get_file_extension(path: &Path) -> Option<String> {
    path.extension()
        .and_then(|ext| ext.to_str())
        .map(|ext| ext.to_lowercase())
}

pub fn is_binary_file(path: &Path) -> bool {
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

pub fn is_content_binary(content: &[u8]) -> bool {
    // Check first 8192 bytes for null bytes (common indicator of binary content)
    let check_length = std::cmp::min(content.len(), 8192);
    content[..check_length].contains(&0)
}

pub fn get_file_type_description(path: &Path) -> String {
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

// File system utilities
pub fn copy_directory_recursive(src: &Path, dst: &Path) -> Result<u64, std::io::Error> {
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

pub fn ensure_parent_dir(path: &Path) -> Result<(), std::io::Error> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    Ok(())
}

pub fn safe_file_operation<F, T>(operation: F, operation_name: &str) -> Result<T, String>
where
    F: FnOnce() -> Result<T, std::io::Error>,
{
    operation().map_err(|e| format!("{}: {}", operation_name, e))
}

pub fn get_default_file_content(filename: &str) -> &'static str {
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