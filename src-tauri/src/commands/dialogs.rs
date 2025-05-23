// src-tauri/src/commands/dialogs.rs
// Commands for file and folder dialog operations

use tauri::api::dialog;

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