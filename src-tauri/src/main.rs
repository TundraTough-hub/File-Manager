// src-tauri/src/main.rs - Updated with modular commands
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod commands;

use std::fs;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // Project management
            commands::load_projects,
            commands::save_projects,
            
            // Basic file operations
            commands::create_folder,
            commands::create_file,
            commands::rename_node,
            commands::delete_node,
            
            // Content management
            commands::get_file_content,
            commands::save_file_content,
            commands::get_file_stats,
            
            // Import/Export operations
            commands::import_file,
            commands::import_folder,
            commands::export_file,
            commands::export_folder,
            
            // File dialogs
            commands::show_file_dialog,
            commands::show_folder_dialog,
            commands::show_save_dialog,
            
            // Python execution
            commands::execute_python_file,
            commands::execute_jupyter_notebook,
            commands::check_python_installation,
            commands::install_python_package,
            
            // Utility and maintenance
            commands::validate_project_structure,
            commands::cleanup_orphaned_files,
            commands::get_project_size,
            commands::get_app_info,
            commands::backup_projects,
            commands::restore_projects_backup,

            // Add to src-tauri/src/main.rs invoke_handler
            //commands::fetch_url,
            //commands::download_file,
            //commands::scrape_webpage,
        ])
        .setup(|app| {
            // Create app directory structure if it doesn't exist
            let app_dir = app.path_resolver().app_data_dir()
                .expect("Failed to get app data directory");
            
            let files_dir = app_dir.join("files");
            let logs_dir = app_dir.join("logs");
            let temp_dir = app_dir.join("temp");
            let backups_dir = app_dir.join("backups");
            
            // Create all necessary directories
            let directories = vec![&app_dir, &files_dir, &logs_dir, &temp_dir, &backups_dir];
            
            for dir in directories {
                if let Err(e) = fs::create_dir_all(dir) {
                    eprintln!("❌ Failed to create directory {:?}: {}", dir, e);
                    return Err(Box::new(e));
                } else {
                    println!("📁 Ensured directory exists: {:?}", dir);
                }
            }
            
            // Initialize logging
            println!("🚀 File Manager App starting...");
            println!("📁 App data directory: {:?}", app_dir);
            println!("📁 Files directory: {:?}", files_dir);
            println!("📁 Logs directory: {:?}", logs_dir);
            println!("📁 Temp directory: {:?}", temp_dir);
            println!("📁 Backups directory: {:?}", backups_dir);
            
            // Clean up any old temporary files on startup
            if temp_dir.exists() {
                if let Err(e) = fs::remove_dir_all(&temp_dir) {
                    eprintln!("⚠️ Failed to clean temp directory: {}", e);
                } else {
                    println!("🧹 Cleaned temp directory");
                }
                
                // Recreate temp directory
                if let Err(e) = fs::create_dir_all(&temp_dir) {
                    eprintln!("❌ Failed to recreate temp directory: {}", e);
                }
            }
            
            // Validate existing projects on startup
            if let Ok(projects_file) = app_dir.join("projects.json").canonicalize() {
                if projects_file.exists() {
                    println!("📋 Found existing projects file: {:?}", projects_file);
                    
                    // Validate the projects file can be read
                    match fs::read_to_string(&projects_file) {
                        Ok(content) => {
                            match serde_json::from_str::<commands::ProjectData>(&content) {
                                Ok(data) => {
                                    println!("✅ Projects file is valid ({} projects, {} nodes, {} clients)", 
                                             data.projects.len(), data.nodes.len(), data.clients.len());
                                }
                                Err(e) => {
                                    eprintln!("⚠️ Projects file has invalid format: {}", e);
                                    
                                    // Create backup of corrupted file
                                    let backup_file = backups_dir.join("projects_corrupted_backup.json");
                                    if let Err(backup_err) = fs::copy(&projects_file, &backup_file) {
                                        eprintln!("❌ Failed to create backup: {}", backup_err);
                                    } else {
                                        println!("💾 Created corrupted file backup at: {:?}", backup_file);
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            eprintln!("❌ Failed to read projects file: {}", e);
                        }
                    }
                }
            }
            
            println!("✅ App setup completed successfully");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}