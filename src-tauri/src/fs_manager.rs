// src-tauri/src/fs_manager.rs

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::process::Command;
use tauri::api::path::app_data_dir;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileSystemNode {
    pub id: String,
    pub name: String,
    pub r#type: String,
    pub extension: Option<String>,
    pub parent_id: Option<String>,
    pub project_id: String,
    pub client_id: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub root_id: String,
    pub client_id: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Client {
    pub id: String,
    pub name: String,
    pub projects: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProjectData {
    pub projects: Vec<Project>,
    pub nodes: Vec<FileSystemNode>,
    pub clients: Vec<Client>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RunResult {
    pub output: String,
    pub success: bool,
    pub error_message: Option<String>,
}

fn get_app_data_dir() -> PathBuf {
    app_data_dir(&tauri::Config::default())
        .expect("Failed to get app directory")
        .join("data")
}

fn ensure_data_dir() -> std::io::Result<PathBuf> {
    let data_dir = get_app_data_dir();
    if !data_dir.exists() {
        fs::create_dir_all(&data_dir)?;
    }
    Ok(data_dir)
}

fn get_projects_file_path() -> PathBuf {
    get_app_data_dir().join("projects.json")
}

fn get_file_content_path(node_id: &str) -> PathBuf {
    get_app_data_dir().join(format!("content_{}.dat", node_id))
}

#[tauri::command]
pub fn load_projects() -> Result<ProjectData, String> {
    let projects_path = get_projects_file_path();
    
    if !projects_path.exists() {
        return Ok(ProjectData {
            projects: Vec::new(),
            nodes: Vec::new(),
            clients: Vec::new(),
        });
    }
    
    match fs::read_to_string(projects_path) {
        Ok(data) => match serde_json::from_str(&data) {
            Ok(projects_data) => Ok(projects_data),
            Err(e) => Err(format!("Failed to parse projects data: {}", e)),
        },
        Err(e) => Err(format!("Failed to read projects data: {}", e)),
    }
}

#[tauri::command]
pub fn save_projects(data: ProjectData) -> Result<(), String> {
    ensure_data_dir().map_err(|e| format!("Failed to create data directory: {}", e))?;
    
    let projects_path = get_projects_file_path();
    let json_data = serde_json::to_string_pretty(&data)
        .map_err(|e| format!("Failed to serialize projects data: {}", e))?;
    
    fs::write(projects_path, json_data)
        .map_err(|e| format!("Failed to write projects data: {}", e))
}

#[tauri::command]
pub fn create_folder(_parent_id: Option<String>, _name: String, _project_id: String) -> Result<String, String> {
    use uuid::Uuid;
    Ok(Uuid::new_v4().to_string())
}

#[tauri::command]
pub fn create_file(_parent_id: Option<String>, _name: String, _project_id: String) -> Result<String, String> {
    use uuid::Uuid;
    Ok(Uuid::new_v4().to_string())
}

#[tauri::command]
pub fn rename_node(_node_id: String, _new_name: String) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub fn delete_node(node_id: String) -> Result<(), String> {
    let content_path = get_file_content_path(&node_id);
    if content_path.exists() {
        fs::remove_file(content_path)
            .map_err(|e| format!("Failed to delete file content: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_file_content(node_id: String) -> Result<String, String> {
    let content_path = get_file_content_path(&node_id);
    
    if !content_path.exists() {
        return Ok(String::new());
    }
    
    fs::read_to_string(content_path)
        .map_err(|e| format!("Failed to read file content: {}", e))
}

#[tauri::command]
pub fn save_file_content(node_id: String, content: String) -> Result<(), String> {
    ensure_data_dir().map_err(|e| format!("Failed to create data directory: {}", e))?;
    
    let content_path = get_file_content_path(&node_id);
    
    fs::write(content_path, content)
        .map_err(|e| format!("Failed to save file content: {}", e))
}

#[tauri::command]
pub fn run_python_file(node_id: String) -> Result<RunResult, String> {
    let content = get_file_content(node_id)?;
    
    let temp_dir = tempfile::tempdir()
        .map_err(|e| format!("Failed to create temporary directory: {}", e))?;
    
    let temp_file_path = temp_dir.path().join("temp_script.py");
    
    fs::write(&temp_file_path, content)
        .map_err(|e| format!("Failed to write temporary file: {}", e))?;
    
    let output = Command::new("python")
        .arg(temp_file_path.to_str().unwrap())
        .output()
        .map_err(|e| format!("Failed to execute Python: {}", e))?;
    
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    
    let success = output.status.success();
    
    Ok(RunResult {
        output: stdout,
        success,
        error_message: if !success { Some(stderr) } else { None },
    })
}

#[tauri::command]
pub fn run_jupyter_notebook(node_id: String) -> Result<RunResult, String> {
    let content = get_file_content(node_id)?;
    
    let temp_dir = tempfile::tempdir()
        .map_err(|e| format!("Failed to create temporary directory: {}", e))?;
    
    let temp_file_path = temp_dir.path().join("temp_notebook.ipynb");
    
    fs::write(&temp_file_path, content)
        .map_err(|e| format!("Failed to write temporary file: {}", e))?;
    
    let output = Command::new("jupyter")
        .arg("nbconvert")
        .arg("--to")
        .arg("notebook")
        .arg("--execute")
        .arg(temp_file_path.to_str().unwrap())
        .output()
        .map_err(|e| format!("Failed to execute Jupyter notebook: {}", e))?;
    
    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    
    let success = output.status.success();
    
    Ok(RunResult {
        output: stdout,
        success,
        error_message: if !success { Some(stderr) } else { None },
    })
}

#[tauri::command]
pub fn run_code_sequence(node_ids: Vec<String>) -> Result<Vec<RunResult>, String> {
    let mut results = Vec::new();
    
    for node_id in node_ids {
        let node_result = match get_file_extension(&node_id)? {
            Some(ext) if ext.to_lowercase() == "py" => run_python_file(node_id),
            Some(ext) if ext.to_lowercase() == "ipynb" => run_jupyter_notebook(node_id),
            _ => Err("Unsupported file type".to_string()),
        };
        
        match node_result {
            Ok(result) => results.push(result),
            Err(e) => {
                results.push(RunResult {
                    output: String::new(),
                    success: false,
                    error_message: Some(e),
                });
            }
        }
    }
    
    Ok(results)
}

fn get_file_extension(node_id: &str) -> Result<Option<String>, String> {
    let data = load_projects()?;
    
    let node = data.nodes.iter()
        .find(|n| n.id == node_id)
        .ok_or_else(|| format!("Node not found: {}", node_id))?;
    
    Ok(node.extension.clone())
}