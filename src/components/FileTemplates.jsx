// src/components/FileTemplates.jsx
import React from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Icon,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiPlus, FiCode, FiFileText, FiSettings, FiBook, FiGlobe, FiDatabase } from 'react-icons/fi';

// File templates with content
export const FILE_TEMPLATES = [
  {
    id: 'python-script',
    name: "Python Script",
    extension: "py",
    icon: FiCode,
    color: "blue.500",
    template: `# Python script
import sys
import os

def main():
    """Main function"""
    print("Hello, World!")
    
    # Your code here
    pass

if __name__ == "__main__":
    main()
`
  },
  {
    id: 'web-scraper',
    name: "Web Scraper Script",
    extension: "py",
    icon: FiGlobe,
    color: "green.500",
    fileName: "web_scraper.py",
    template: `#!/usr/bin/env python3
"""
Web Scraping Template
Access project files, scrape web data, and save results
"""

import os
import sys
import json
import requests
from pathlib import Path
from bs4 import BeautifulSoup
import pandas as pd
from urllib.parse import urljoin, urlparse

# Project directory is the current working directory
PROJECT_DIR = Path.cwd()
DATA_DIR = PROJECT_DIR / "data"
OUTPUT_DIR = PROJECT_DIR / "output"

def setup_directories():
    """Create necessary directories"""
    DATA_DIR.mkdir(exist_ok=True)
    OUTPUT_DIR.mkdir(exist_ok=True)
    print(f"✅ Directories ready: {DATA_DIR}, {OUTPUT_DIR}")

def read_project_file(file_path):
    """Read a file from the project directory"""
    full_path = PROJECT_DIR / file_path
    
    if not full_path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")
    
    # Handle different file types
    if full_path.suffix.lower() == '.json':
        with open(full_path, 'r') as f:
            return json.load(f)
    elif full_path.suffix.lower() == '.csv':
        return pd.read_csv(full_path)
    else:
        with open(full_path, 'r') as f:
            return f.read()

def save_project_file(data, file_path, file_format='txt'):
    """Save data to a file in the project directory"""
    full_path = PROJECT_DIR / file_path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    
    if file_format == 'json':
        with open(full_path, 'w') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    elif file_format == 'csv':
        if isinstance(data, pd.DataFrame):
            data.to_csv(full_path, index=False)
        else:
            raise ValueError("Data must be a pandas DataFrame for CSV format")
    else:
        with open(full_path, 'w') as f:
            f.write(str(data))
    
    print(f"💾 Saved: {file_path}")

def scrape_website(url, headers=None):
    """Scrape a website and return BeautifulSoup object"""
    if headers is None:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    
    print(f"🕷️ Scraping: {url}")
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        print(f"✅ Successfully scraped {len(response.content)} bytes")
        
        return soup
    except requests.RequestException as e:
        print(f"❌ Scraping failed: {e}")
        raise

def extract_links(soup, base_url):
    """Extract all links from a BeautifulSoup object"""
    links = []
    for link in soup.find_all('a', href=True):
        href = link['href']
        full_url = urljoin(base_url, href)
        links.append({
            'text': link.get_text(strip=True),
            'url': full_url,
            'domain': urlparse(full_url).netloc
        })
    return links

def extract_text_content(soup, selector=None):
    """Extract text content from HTML"""
    if selector:
        elements = soup.select(selector)
        return [elem.get_text(strip=True) for elem in elements]
    else:
        return soup.get_text(strip=True)

def main():
    """Main scraping function - customize this for your needs"""
    setup_directories()
    
    # Example: Read configuration from project file
    try:
        config = read_project_file('config.json')
        print(f"📋 Loaded config: {config}")
    except FileNotFoundError:
        print("⚠️ No config.json found, using defaults")
        config = {
            "target_url": "https://example.com",
            "output_format": "json"
        }
    
    # Example scraping workflow
    url = config.get("target_url", "https://httpbin.org/html")
    
    try:
        # Scrape the website
        soup = scrape_website(url)
        
        # Extract data
        title = soup.find('title')
        title_text = title.get_text() if title else "No title"
        
        # Extract all paragraphs
        paragraphs = [p.get_text(strip=True) for p in soup.find_all('p')]
        
        # Extract all links
        links = extract_links(soup, url)
        
        # Compile results
        results = {
            'url': url,
            'title': title_text,
            'paragraphs': paragraphs,
            'links': links,
            'scraped_at': pd.Timestamp.now().isoformat()
        }
        
        # Save results
        output_format = config.get("output_format", "json")
        
        if output_format == "json":
            save_project_file(results, 'output/scraped_data.json', 'json')
        
        # Also save as CSV for links
        if links:
            links_df = pd.DataFrame(links)
            save_project_file(links_df, 'output/extracted_links.csv', 'csv')
        
        # Save summary
        summary = f"""Scraping Summary
URL: {url}
Title: {title_text}
Paragraphs found: {len(paragraphs)}
Links found: {len(links)}
Scraped at: {results['scraped_at']}
"""
        save_project_file(summary, 'output/scraping_summary.txt')
        
        print(f"✅ Scraping completed successfully!")
        print(f"📊 Found {len(paragraphs)} paragraphs and {len(links)} links")
        
    except Exception as e:
        error_msg = f"❌ Scraping failed: {str(e)}"
        print(error_msg)
        save_project_file(error_msg, 'output/error_log.txt')
        sys.exit(1)

if __name__ == "__main__":
    main()
`
  },
  {
    id: 'data-processor',
    name: "Data Processor Script",
    extension: "py",
    icon: FiDatabase,
    color: "purple.500",
    fileName: "data_processor.py",
    template: `#!/usr/bin/env python3
"""
Data Processing Template
Process scraped data and generate insights
"""

import os
import sys
import json
import pandas as pd
from pathlib import Path
import matplotlib.pyplot as plt
import seaborn as sns

# Project directory is the current working directory
PROJECT_DIR = Path.cwd()
DATA_DIR = PROJECT_DIR / "data"
OUTPUT_DIR = PROJECT_DIR / "output"

def setup_directories():
    """Create necessary directories"""
    DATA_DIR.mkdir(exist_ok=True)
    OUTPUT_DIR.mkdir(exist_ok=True)
    print(f"✅ Directories ready: {DATA_DIR}, {OUTPUT_DIR}")

def load_scraped_data():
    """Load data from scraping results"""
    data_files = []
    
    # Look for common data files
    for pattern in ['*.csv', '*.json']:
        data_files.extend(DATA_DIR.glob(pattern))
        data_files.extend(OUTPUT_DIR.glob(pattern))
    
    if not data_files:
        raise FileNotFoundError("No data files found in data/ or output/ directories")
    
    print(f"📂 Found {len(data_files)} data files")
    return data_files

def process_csv_data(file_path):
    """Process CSV data"""
    df = pd.read_csv(file_path)
    print(f"📊 Loaded CSV: {file_path.name} ({len(df)} rows)")
    
    # Basic analysis
    summary = {
        'file': file_path.name,
        'rows': len(df),
        'columns': list(df.columns),
        'dtypes': df.dtypes.to_dict()
    }
    
    return df, summary

def generate_report(data_summaries):
    """Generate a processing report"""
    report = f"""Data Processing Report
Generated: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}

Files Processed:
"""
    
    for summary in data_summaries:
        report += f"""
- {summary['file']}: {summary['rows']} rows
  Columns: {', '.join(summary['columns'])}
"""
    
    return report

def main():
    """Main data processing function"""
    setup_directories()
    
    try:
        # Load available data
        data_files = load_scraped_data()
        data_summaries = []
        
        for file_path in data_files:
            if file_path.suffix.lower() == '.csv':
                df, summary = process_csv_data(file_path)
                data_summaries.append(summary)
                
                # Example analysis: save basic stats
                if len(df) > 0:
                    stats_file = OUTPUT_DIR / f"{file_path.stem}_stats.json"
                    with open(stats_file, 'w') as f:
                        json.dump(summary, f, indent=2, default=str)
        
        # Generate and save report
        report = generate_report(data_summaries)
        report_file = OUTPUT_DIR / "processing_report.txt"
        with open(report_file, 'w') as f:
            f.write(report)
        
        print(f"✅ Data processing completed!")
        print(f"📋 Report saved to: {report_file}")
        
    except Exception as e:
        error_msg = f"❌ Data processing failed: {str(e)}"
        print(error_msg)
        sys.exit(1)

if __name__ == "__main__":
    main()
`
  },
  {
    id: 'jupyter-notebook',
    name: "Jupyter Notebook",
    extension: "ipynb",
    icon: FiBook,
    color: "orange.500",
    template: `{
 "cells": [
  {
   "cell_type": "markdown",
   "metadata": {},
   "source": [
    "# Data Analysis Notebook\\n",
    "\\n",
    "This notebook processes scraped data and generates insights."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Import libraries\\n",
    "import pandas as pd\\n",
    "import numpy as np\\n",
    "import matplotlib.pyplot as plt\\n",
    "import seaborn as sns\\n",
    "from pathlib import Path\\n",
    "\\n",
    "# Setup\\n",
    "PROJECT_DIR = Path.cwd()\\n",
    "DATA_DIR = PROJECT_DIR / 'data'\\n",
    "OUTPUT_DIR = PROJECT_DIR / 'output'\\n",
    "\\n",
    "print('📁 Project directory:', PROJECT_DIR)"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Load scraped data\\n",
    "# TODO: Replace with your actual data files\\n",
    "data_files = list(DATA_DIR.glob('*.csv')) + list(OUTPUT_DIR.glob('*.csv'))\\n",
    "print(f'Found {len(data_files)} CSV files:', [f.name for f in data_files])"
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Analysis and visualization\\n",
    "# Add your analysis code here\\n",
    "print('Ready for analysis!')"
   ]
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "Python 3",
   "language": "python",
   "name": "python3"
  },
  "language_info": {
   "name": "python",
   "version": "3.9.0"
  }
 },
 "nbformat": 4,
 "nbformat_minor": 4
}`
  },
  {
    id: 'requirements',
    name: "Requirements File",
    extension: "txt",
    icon: FiSettings,
    color: "green.500",
    fileName: "requirements.txt",
    template: `# Python Requirements for Web Scraping and Data Processing
# Usage: pip install -r requirements.txt

# Web Scraping
requests>=2.28.0
beautifulsoup4>=4.11.0
lxml>=4.9.0
selenium>=4.8.0

# Data Science
numpy>=1.21.0
pandas>=1.5.0
matplotlib>=3.6.0
seaborn>=0.12.0

# Machine Learning (optional)
scikit-learn>=1.2.0
# tensorflow>=2.6.0

# Jupyter
jupyter>=1.0.0
ipykernel>=6.0.0
jupyterlab>=3.5.0

# Utilities
python-dotenv>=0.19.0
tqdm>=4.64.0

# Development
pytest>=7.0.0
black>=22.0.0
flake8>=5.0.0
`
  },
  {
    id: 'config',
    name: "Scraping Configuration",
    extension: "json",
    icon: FiSettings,
    color: "yellow.500",
    fileName: "config.json",
    template: `{
  "scraping": {
    "target_urls": [
      "https://example.com"
    ],
    "output_format": "json",
    "delay_between_requests": 1,
    "max_retries": 3,
    "timeout": 30
  },
  "data_processing": {
    "clean_data": true,
    "remove_duplicates": true,
    "export_formats": ["csv", "json"]
  },
  "project": {
    "name": "Web Scraping Project",
    "version": "1.0.0",
    "author": "Your Name",
    "description": "Automated web scraping and data processing"
  },
  "paths": {
    "data_dir": "./data",
    "output_dir": "./output",
    "logs_dir": "./logs"
  },
  "headers": {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  }
}`
  },
  // ... keep all your existing templates (readme, gitignore, main-script, etc.)
  {
    id: 'readme',
    name: "README Documentation",
    extension: "md",
    icon: FiFileText,
    color: "purple.500",
    fileName: "README.md",
    template: `# Web Scraping Project

## Description
Automated web scraping and data processing project.

## Installation

### Prerequisites
- Python 3.9 or higher
- pip package manager

### Setup
1. Clone this repository
2. Install dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

## Usage

### Running the web scraper
\`\`\`bash
python web_scraper.py
\`\`\`

### Processing scraped data
\`\`\`bash
python data_processor.py
\`\`\`

### Running Jupyter notebooks
\`\`\`bash
jupyter notebook
\`\`\`

## Project Structure
\`\`\`
project/
├── web_scraper.py      # Main scraping script
├── data_processor.py   # Data processing script
├── requirements.txt    # Python dependencies
├── config.json        # Configuration settings
├── README.md          # This file
├── data/              # Raw scraped data
├── output/            # Processed results
└── logs/              # Log files
\`\`\`

## Features
- Web scraping with requests and BeautifulSoup
- Data processing with pandas
- Configurable scraping parameters
- Export to multiple formats (CSV, JSON)

## Configuration
Edit \`config.json\` to customize:
- Target URLs
- Output formats
- Request delays
- Headers and user agents

## Dependencies
See \`requirements.txt\` for a full list of dependencies.

## License
[Your License Here]
`
  },
  {
    id: 'gitignore',
    name: "Git Ignore File",
    extension: "gitignore",
    icon: FiSettings,
    color: "gray.500",
    fileName: ".gitignore",
    template: `# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual Environment
venv/
env/
ENV/

# Jupyter Notebook
.ipynb_checkpoints

# PyCharm
.idea/

# VS Code
.vscode/

# Scraped data (be careful - you might want to keep some)
data/*.html
data/*.xml
logs/

# Large data files
*.csv
*.xlsx
*.json
!config.json

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Environment variables
.env
.env.local
`
  },
  {
    id: 'main-script',
    name: "Main Application Script",
    extension: "py",
    icon: FiCode,
    color: "blue.600",
    fileName: "main.py",
    template: `#!/usr/bin/env python3
"""
Main application script for web scraping pipeline
"""

import sys
import os
import argparse
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def setup_directories():
    """Create necessary directories if they don't exist"""
    directories = ['data', 'output', 'logs']
    for dir_name in directories:
        Path(dir_name).mkdir(exist_ok=True)
        logger.info(f"Ensured directory exists: {dir_name}")

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Web scraping pipeline')
    parser.add_argument('--scrape', action='store_true', 
                       help='Run web scraping')
    parser.add_argument('--process', action='store_true',
                       help='Process scraped data')
    parser.add_argument('--all', action='store_true',
                       help='Run complete pipeline')
    parser.add_argument('--verbose', '-v', action='store_true', 
                       help='Enable verbose logging')
    parser.add_argument('--config', '-c', type=str, default='config.json',
                       help='Configuration file path')
    return parser.parse_args()

def run_scraping():
    """Run the web scraping script"""
    logger.info("Starting web scraping...")
    # Import and run your scraper
    # You can import web_scraper and call its main function
    # or use subprocess to run it as a separate process
    import subprocess
    result = subprocess.run([sys.executable, "web_scraper.py"], 
                          capture_output=True, text=True)
    if result.returncode == 0:
        logger.info("Web scraping completed successfully")
    else:
        logger.error(f"Web scraping failed: {result.stderr}")
        return False
    return True

def run_processing():
    """Run the data processing script"""
    logger.info("Starting data processing...")
    import subprocess
    result = subprocess.run([sys.executable, "data_processor.py"], 
                          capture_output=True, text=True)
    if result.returncode == 0:
        logger.info("Data processing completed successfully")
    else:
        logger.error(f"Data processing failed: {result.stderr}")
        return False
    return True

def main():
    """Main function"""
    args = parse_arguments()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    logger.info("Starting scraping pipeline...")
    
    # Setup
    setup_directories()
    
    try:
        if args.all or args.scrape:
            if not run_scraping():
                sys.exit(1)
        
        if args.all or args.process:
            if not run_processing():
                sys.exit(1)
        
        if not (args.scrape or args.process or args.all):
            logger.info("No action specified. Use --scrape, --process, or --all")
            logger.info("Run with --help for more options")
        
        logger.info("Pipeline completed successfully")
        
    except Exception as e:
        logger.error(f"Pipeline failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
`
  }
];

// Quick file creation component (rest of your existing component code stays the same)
const FileTemplates = ({ 
  onCreateFile, 
  currentFolderId, 
  projectId, 
  isDisabled = false 
}) => {
  const handleCreateFile = async (template) => {
    const fileName = template.fileName || `new_file.${template.extension}`;
    
    try {
      await onCreateFile(currentFolderId, fileName, projectId, true);
      // Note: The template content would be applied after file creation
      // You might want to modify your createFile function to accept template content
    } catch (error) {
      console.error('Failed to create file from template:', error);
    }
  };

  return (
    <Menu>
      <MenuButton 
        as={Button} 
        leftIcon={<FiPlus />} 
        size="sm" 
        colorScheme="blue"
        variant="outline"
        isDisabled={isDisabled}
      >
        Quick Create
      </MenuButton>
      <MenuList maxH="400px" overflowY="auto">
        <Text px={3} py={2} fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
          Web Scraping
        </Text>
        {FILE_TEMPLATES.filter(t => ['web-scraper', 'data-processor'].includes(t.id)).map((template) => (
          <MenuItem 
            key={template.id}
            onClick={() => handleCreateFile(template)}
            icon={<Icon as={template.icon} color={template.color} />}
          >
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" fontWeight="medium">{template.name}</Text>
              <Text fontSize="xs" color="gray.500">{template.fileName}</Text>
            </VStack>
          </MenuItem>
        ))}
        
        <Text px={3} py={2} fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mt={2}>
          Python Files
        </Text>
        {FILE_TEMPLATES.filter(t => ['py', 'ipynb'].includes(t.extension) && !['web-scraper', 'data-processor'].includes(t.id)).map((template) => (
          <MenuItem 
            key={template.id}
            onClick={() => handleCreateFile(template)}
            icon={<Icon as={template.icon} color={template.color} />}
          >
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" fontWeight="medium">{template.name}</Text>
              <Text fontSize="xs" color="gray.500">.{template.extension}</Text>
            </VStack>
          </MenuItem>
        ))}
        
        <Text px={3} py={2} fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mt={2}>
          Project Files
        </Text>
        {FILE_TEMPLATES.filter(t => !['py', 'ipynb'].includes(t.extension)).map((template) => (
          <MenuItem 
            key={template.id}
            onClick={() => handleCreateFile(template)}
            icon={<Icon as={template.icon} color={template.color} />}
          >
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" fontWeight="medium">{template.name}</Text>
              <Text fontSize="xs" color="gray.500">
                {template.fileName || `.${template.extension}`}
              </Text>
            </VStack>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default FileTemplates;