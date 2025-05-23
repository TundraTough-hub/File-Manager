// src-tauri/src/commands/execution.rs
// Commands for executing Python files and managing Python environment

use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader};
use tauri::AppHandle;
use super::{ExecutionResult, utils::*};

#[tauri::command]
pub async fn execute_python_file(
    app: AppHandle,
    _node_id: String,
    file_path: String,
    project_id: String,
) -> Result<ExecutionResult, String> {
    let project_dir = get_project_dir(&app, &project_id)?;
    let full_path = project_dir.join(&file_path);
    
    if !full_path.exists() {
        return Err("Python file not found".to_string());
    }

    let start_time = std::time::Instant::now();
    println!("🐍 Executing Python file: {:?}", full_path);

    // Try different Python commands
    let python_commands = ["python3", "python", "py"];
    let mut last_error = String::new();

    for python_cmd in &python_commands {
        match Command::new(python_cmd)
            .arg(&full_path)
            .current_dir(&project_dir)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
        {
            Ok(mut child) => {
                let stdout = child.stdout.take().unwrap();
                let stderr = child.stderr.take().unwrap();

                let stdout_reader = BufReader::new(stdout);
                let stderr_reader = BufReader::new(stderr);

                let mut stdout_lines = Vec::new();
                let mut stderr_lines = Vec::new();

                // Read stdout
                for line in stdout_reader.lines() {
                    if let Ok(line) = line {
                        stdout_lines.push(line);
                    }
                }

                // Read stderr
                for line in stderr_reader.lines() {
                    if let Ok(line) = line {
                        stderr_lines.push(line);
                    }
                }

                let exit_status = child.wait().map_err(|e| e.to_string())?;
                let duration = start_time.elapsed().as_millis() as u64;

                let result = ExecutionResult {
                    success: exit_status.success(),
                    stdout: stdout_lines.join("\n"),
                    stderr: stderr_lines.join("\n"),
                    exit_code: exit_status.code(),
                    duration_ms: duration,
                };

                println!("✅ Python execution completed in {}ms", duration);
                return Ok(result);
            }
            Err(e) => {
                last_error = format!("{}: {}", python_cmd, e);
                continue;
            }
        }
    }

    Err(format!("Failed to execute Python. Last error: {}", last_error))
}

#[tauri::command]
pub async fn execute_jupyter_notebook(
    app: AppHandle,
    _node_id: String,
    file_path: String,
    project_id: String,
) -> Result<ExecutionResult, String> {
    let project_dir = get_project_dir(&app, &project_id)?;
    let full_path = project_dir.join(&file_path);
    
    if !full_path.exists() {
        return Err("Jupyter notebook not found".to_string());
    }

    let start_time = std::time::Instant::now();
    println!("📓 Executing Jupyter notebook: {:?}", full_path);

    // Try jupyter nbconvert
    match Command::new("jupyter")
        .args(&["nbconvert", "--to", "notebook", "--execute", "--inplace"])
        .arg(&full_path)
        .current_dir(&project_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
    {
        Ok(mut child) => {
            let stdout = child.stdout.take().unwrap();
            let stderr = child.stderr.take().unwrap();

            let stdout_reader = BufReader::new(stdout);
            let stderr_reader = BufReader::new(stderr);

            let mut stdout_lines = Vec::new();
            let mut stderr_lines = Vec::new();

            // Read outputs
            for line in stdout_reader.lines() {
                if let Ok(line) = line {
                    stdout_lines.push(line);
                }
            }

            for line in stderr_reader.lines() {
                if let Ok(line) = line {
                    stderr_lines.push(line);
                }
            }

            let exit_status = child.wait().map_err(|e| e.to_string())?;
            let duration = start_time.elapsed().as_millis() as u64;

            let result = ExecutionResult {
                success: exit_status.success(),
                stdout: stdout_lines.join("\n"),
                stderr: stderr_lines.join("\n"),
                exit_code: exit_status.code(),
                duration_ms: duration,
            };

            println!("✅ Jupyter execution completed in {}ms", duration);
            Ok(result)
        }
        Err(e) => Err(format!("Failed to execute Jupyter notebook: {}", e))
    }
}

#[tauri::command]
pub async fn check_python_installation() -> Result<Vec<String>, String> {
    let mut available_pythons = Vec::new();
    let python_commands = ["python3", "python", "py"];

    for python_cmd in &python_commands {
        match Command::new(python_cmd)
            .arg("--version")
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
        {
            Ok(mut child) => {
                if let Ok(exit_status) = child.wait() {
                    if exit_status.success() {
                        available_pythons.push(python_cmd.to_string());
                    }
                }
            }
            Err(_) => continue,
        }
    }

    if available_pythons.is_empty() {
        return Err("No Python installation found".to_string());
    }

    Ok(available_pythons)
}

#[tauri::command]
pub async fn install_python_package(
    package_name: String,
    python_cmd: Option<String>,
) -> Result<ExecutionResult, String> {
    let python_command = python_cmd.unwrap_or_else(|| "pip".to_string());
    let start_time = std::time::Instant::now();

    println!("📦 Installing Python package: {}", package_name);

    match Command::new(&python_command)
        .args(&["install", &package_name])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
    {
        Ok(mut child) => {
            let stdout = child.stdout.take().unwrap();
            let stderr = child.stderr.take().unwrap();

            let stdout_reader = BufReader::new(stdout);
            let stderr_reader = BufReader::new(stderr);

            let mut stdout_lines = Vec::new();
            let mut stderr_lines = Vec::new();

            for line in stdout_reader.lines() {
                if let Ok(line) = line {
                    stdout_lines.push(line);
                }
            }

            for line in stderr_reader.lines() {
                if let Ok(line) = line {
                    stderr_lines.push(line);
                }
            }

            let exit_status = child.wait().map_err(|e| e.to_string())?;
            let duration = start_time.elapsed().as_millis() as u64;

            Ok(ExecutionResult {
                success: exit_status.success(),
                stdout: stdout_lines.join("\n"),
                stderr: stderr_lines.join("\n"),
                exit_code: exit_status.code(),
                duration_ms: duration,
            })
        }
        Err(e) => Err(format!("Failed to install package: {}", e))
    }
}