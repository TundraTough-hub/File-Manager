// src-tauri/src/commands/web_scraping.rs
// Commands for web scraping and HTTP requests

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct HttpRequest {
    pub url: String,
    pub method: String, // GET, POST, etc.
    pub headers: Option<HashMap<String, String>>,
    pub body: Option<String>,
    pub timeout_seconds: Option<u64>,
}

#[derive(Debug, Serialize)]
pub struct HttpResponse {
    pub status: u16,
    pub headers: HashMap<String, String>,
    pub body: String,
    pub success: bool,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn fetch_url(request: HttpRequest) -> Result<HttpResponse, String> {
    use reqwest::Client;
    use std::time::Duration;
    
    let client = Client::builder()
        .timeout(Duration::from_secs(request.timeout_seconds.unwrap_or(30)))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;
    
    let mut req_builder = match request.method.to_uppercase().as_str() {
        "GET" => client.get(&request.url),
        "POST" => client.post(&request.url),
        "PUT" => client.put(&request.url),
        "DELETE" => client.delete(&request.url),
        _ => return Err("Unsupported HTTP method".to_string()),
    };
    
    // Add headers if provided
    if let Some(headers) = request.headers {
        for (key, value) in headers {
            req_builder = req_builder.header(&key, &value);
        }
    }
    
    // Add body if provided
    if let Some(body) = request.body {
        req_builder = req_builder.body(body);
    }
    
    println!("🌐 Making HTTP request: {} {}", request.method, request.url);
    
    match req_builder.send().await {
        Ok(response) => {
            let status = response.status().as_u16();
            let headers: HashMap<String, String> = response
                .headers()
                .iter()
                .map(|(k, v)| (k.to_string(), v.to_str().unwrap_or("").to_string()))
                .collect();
            
            match response.text().await {
                Ok(body) => {
                    println!("✅ HTTP request completed: {} bytes", body.len());
                    Ok(HttpResponse {
                        status,
                        headers,
                        body,
                        success: true,
                        error: None,
                    })
                }
                Err(e) => {
                    let error_msg = format!("Failed to read response body: {}", e);
                    Ok(HttpResponse {
                        status,
                        headers,
                        body: String::new(),
                        success: false,
                        error: Some(error_msg),
                    })
                }
            }
        }
        Err(e) => {
            let error_msg = format!("HTTP request failed: {}", e);
            println!("❌ {}", error_msg);
            Ok(HttpResponse {
                status: 0,
                headers: HashMap::new(),
                body: String::new(),
                success: false,
                error: Some(error_msg),
            })
        }
    }
}

#[tauri::command]
pub async fn download_file(
    app: AppHandle,
    url: String,
    project_id: String,
    file_path: String,
) -> Result<super::ImportResult, String> {
    use reqwest::Client;
    use std::io::Write;
    use uuid::Uuid;
    
    let client = Client::new();
    
    println!("📥 Downloading file from: {}", url);
    
    let response = client.get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to download file: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("HTTP error: {}", response.status()));
    }
    
    let bytes = response.bytes()
        .await
        .map_err(|e| format!("Failed to read file bytes: {}", e))?;
    
    // Save to project directory
    let project_dir = super::utils::get_project_dir(&app, &project_id)?;
    let full_path = project_dir.join(&file_path);
    
    super::utils::ensure_parent_dir(&full_path)
        .map_err(|e| format!("Failed to create directory: {}", e))?;
    
    let mut file = std::fs::File::create(&full_path)
        .map_err(|e| format!("Failed to create file: {}", e))?;
    
    file.write_all(&bytes)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    
    let file_name = full_path.file_name()
        .unwrap_or_else(|| std::ffi::OsStr::new(&file_path))
        .to_string_lossy()
        .to_string();
    
    let extension = super::utils::get_file_extension(&full_path);
    let is_binary = super::utils::is_binary_file(&full_path);
    
    println!("✅ Downloaded file: {} ({} bytes)", file_name, bytes.len());
    
    Ok(super::ImportResult {
        node_id: Uuid::new_v4().to_string(),
        name: file_name,
        r#type: "file".to_string(),
        extension,
        size: bytes.len() as u64,
        is_binary,
    })
}

#[tauri::command]
pub async fn scrape_webpage(
    url: String,
    selector: Option<String>,
) -> Result<String, String> {
    use reqwest::Client;
    use scraper::{Html, Selector};
    
    let client = Client::new();
    
    println!("🕷️ Scraping webpage: {}", url);
    
    let response = client.get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch webpage: {}", e))?;
    
    let html_content = response.text()
        .await
        .map_err(|e| format!("Failed to read webpage content: {}", e))?;
    
    if let Some(css_selector) = selector {
        // Parse HTML and extract specific elements
        let document = Html::parse_document(&html_content);
        let selector = Selector::parse(&css_selector)
            .map_err(|e| format!("Invalid CSS selector: {}", e))?;
        
        let mut extracted_text = Vec::new();
        for element in document.select(&selector) {
            extracted_text.push(element.text().collect::<Vec<_>>().join(" "));
        }
        
        Ok(extracted_text.join("\n"))
    } else {
        // Return full HTML
        Ok(html_content)
    }
}