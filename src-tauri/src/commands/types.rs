// src-tauri/src/commands/types.rs
// Shared types used across all command modules

use serde::{Deserialize, Serialize};

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
    pub is_binary: Option<bool>, // Track binary files
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

#[derive(Debug, Serialize)]
pub struct ExecutionResult {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: Option<i32>,
    pub duration_ms: u64,
}