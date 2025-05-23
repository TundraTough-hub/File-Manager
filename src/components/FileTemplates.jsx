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
import { FiPlus, FiCode, FiFileText, FiSettings, FiBook } from 'react-icons/fi';

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
    "# New Notebook\\n",
    "\\n",
    "Description of what this notebook does."
   ]
  },
  {
   "cell_type": "code",
   "execution_count": null,
   "metadata": {},
   "outputs": [],
   "source": [
    "# Your code here\\n",
    "import pandas as pd\\n",
    "import numpy as np\\n",
    "import matplotlib.pyplot as plt\\n",
    "\\n",
    "print('Hello from Jupyter!')"
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
    template: `# Python Requirements
# Usage: pip install -r requirements.txt

# Data Science
numpy>=1.21.0
pandas>=1.3.0
matplotlib>=3.4.0
seaborn>=0.11.0

# Machine Learning
scikit-learn>=1.0.0
tensorflow>=2.6.0

# Jupyter
jupyter>=1.0.0
ipykernel>=6.0.0

# Development
pytest>=6.0.0
black>=21.0.0
flake8>=3.9.0
`
  },
  {
    id: 'readme',
    name: "README Documentation",
    extension: "md",
    icon: FiFileText,
    color: "purple.500",
    fileName: "README.md",
    template: `# Project Title

## Description
Brief description of what this project does and its purpose.

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

### Running the main script
\`\`\`bash
python main.py
\`\`\`

### Running Jupyter notebooks
\`\`\`bash
jupyter notebook
\`\`\`

## Project Structure
\`\`\`
project/
├── main.py              # Main application script
├── requirements.txt     # Python dependencies
├── README.md           # This file
├── data/               # Data files
├── notebooks/          # Jupyter notebooks
└── src/                # Source code modules
\`\`\`

## Features
- Feature 1: Description
- Feature 2: Description
- Feature 3: Description

## Dependencies
See \`requirements.txt\` for a full list of dependencies.

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License
[Your License Here]
`
  },
  {
    id: 'config',
    name: "Configuration File",
    extension: "json",
    icon: FiSettings,
    color: "yellow.500",
    fileName: "config.json",
    template: `{
  "project": {
    "name": "New Project",
    "version": "1.0.0",
    "author": "Your Name",
    "description": "Project description"
  },
  "settings": {
    "debug": true,
    "log_level": "INFO",
    "max_workers": 4
  },
  "paths": {
    "data_dir": "./data",
    "output_dir": "./output",
    "logs_dir": "./logs"
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "project_db"
  },
  "api": {
    "base_url": "https://api.example.com",
    "timeout": 30,
    "retries": 3
  }
}`
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

# Data files
*.csv
*.xlsx
*.json
!config.json

# Logs
*.log
logs/

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
.env.development.local
.env.test.local
.env.production.local
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
Main application script
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
    parser = argparse.ArgumentParser(description='Main application script')
    parser.add_argument('--verbose', '-v', action='store_true', 
                       help='Enable verbose logging')
    parser.add_argument('--config', '-c', type=str, default='config.json',
                       help='Configuration file path')
    return parser.parse_args()

def main():
    """Main function"""
    args = parse_arguments()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    logger.info("Starting application...")
    
    # Setup
    setup_directories()
    
    # Your main application logic here
    try:
        logger.info("Processing data...")
        
        # Example processing
        print("Hello, World!")
        print("Application is running successfully!")
        
        logger.info("Application completed successfully")
        
    except Exception as e:
        logger.error(f"Application failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
`
  }
];

// Quick file creation component
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
          Python Files
        </Text>
        {FILE_TEMPLATES.filter(t => ['py', 'ipynb'].includes(t.extension)).map((template) => (
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