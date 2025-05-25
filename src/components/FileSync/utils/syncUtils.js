// src/components/FileSync/utils/syncUtils.js
// Helper functions for file sync operations

import { 
  FiFile, 
  FiFolder, 
  FiCode,
  FiFileText,
  FiBook,
  FiDatabase,
  FiImage,
  FiArchive,
  FiVideo,
  FiMusic,
} from 'react-icons/fi';

/**
 * Get appropriate icon for a file or folder
 * @param {Object} node - The file/folder node
 * @returns {React.Component} The appropriate icon component
 */
export const getFileIcon = (node) => {
  if (node.type === 'folder') return FiFolder;
  
  const ext = node.extension?.toLowerCase();
  if (!ext) return FiFile;
  
  // Python files
  if (ext === 'py') return FiCode;
  if (ext === 'ipynb') return FiBook;
  
  // Data files
  if (['csv', 'json', 'xml'].includes(ext)) return FiDatabase;
  
  // Text files
  if (['txt', 'md'].includes(ext)) return FiFileText;
  
  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'webp'].includes(ext)) return FiImage;
  
  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) return FiArchive;
  
  // Media
  if (['mp4', 'avi', 'mov', 'wmv', 'webm', 'mkv'].includes(ext)) return FiVideo;
  if (['mp3', 'wav', 'flac', 'ogg', 'aac'].includes(ext)) return FiMusic;
  
  return FiFile;
};

/**
 * Get appropriate icon color for a file or folder
 * @param {Object} node - The file/folder node
 * @returns {string} The Chakra UI color string
 */
export const getFileIconColor = (node) => {
  if (node.type === 'folder') return 'yellow.500';
  
  const ext = node.extension?.toLowerCase();
  if (!ext) return 'gray.500';
  
  // Python files - blue shades
  if (ext === 'py') return 'blue.500';
  if (ext === 'ipynb') return 'orange.600';
  
  // Data files - green shades
  if (ext === 'csv') return 'green.500';
  if (ext === 'json') return 'yellow.600';
  if (ext === 'xml') return 'orange.600';
  
  // Text files - gray/blue
  if (ext === 'txt') return 'gray.600';
  if (ext === 'md') return 'blue.400';
  
  // Images - pink
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'webp'].includes(ext)) return 'pink.500';
  
  // Archives - brown/amber
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) return 'amber.600';
  
  // Media - varied colors
  if (['mp4', 'avi', 'mov', 'wmv', 'webm', 'mkv'].includes(ext)) return 'red.400';
  if (['mp3', 'wav', 'flac', 'ogg', 'aac'].includes(ext)) return 'purple.500';
  
  return 'gray.500';
};

/**
 * Format file size to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get user-friendly file type description
 * @param {Object} node - The file/folder node
 * @returns {string} Human readable file type
 */
export const getFileTypeDescription = (node) => {
  if (node.type === 'folder') return 'Folder';
  
  const ext = node.extension?.toLowerCase();
  if (!ext) return 'File';
  
  const typeMap = {
    'py': 'Python Script',
    'ipynb': 'Jupyter Notebook',
    'csv': 'CSV Data',
    'json': 'JSON Data',
    'xml': 'XML Data',
    'txt': 'Text File',
    'md': 'Markdown File',
    'jpg': 'JPEG Image',
    'jpeg': 'JPEG Image',
    'png': 'PNG Image',
    'gif': 'GIF Image',
    'svg': 'SVG Image',
    'zip': 'ZIP Archive',
    'rar': 'RAR Archive',
    '7z': '7-Zip Archive',
    'mp3': 'MP3 Audio',
    'mp4': 'MP4 Video',
  };
  
  return typeMap[ext] || `${ext.toUpperCase()} File`;
};

/**
 * Generate sync summary text
 * @param {Array} syncedFiles - Array of synced files
 * @param {string} syncType - Type of sync operation ('normal' or 'rebuild')
 * @returns {Object} Summary statistics
 */
export const generateSyncSummary = (syncedFiles, syncType) => {
  const fileCount = syncedFiles.filter(f => f.type === 'file').length;
  const folderCount = syncedFiles.filter(f => f.type === 'folder').length;
  const totalSize = syncedFiles.reduce((sum, file) => sum + (file.size || 0), 0);
  
  return {
    fileCount,
    folderCount,
    totalCount: syncedFiles.length,
    totalSize: formatFileSize(totalSize),
    isRebuild: syncType === 'rebuild',
  };
};

/**
 * Validate sync parameters
 * @param {string} projectId - The project ID
 * @returns {Object} Validation result
 */
export const validateSyncParams = (projectId) => {
  if (!projectId) {
    return {
      isValid: false,
      error: 'No project selected'
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

/**
 * Group files by type for display
 * @param {Array} files - Array of file objects
 * @returns {Object} Files grouped by type
 */
export const groupFilesByType = (files) => {
  return files.reduce((groups, file) => {
    const type = file.type === 'folder' ? 'folders' : 'files';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(file);
    return groups;
  }, {});
};

/**
 * Get sync operation display text
 * @param {string} syncType - Type of sync operation
 * @param {boolean} isLoading - Whether operation is in progress
 * @returns {Object} Display text for UI
 */
export const getSyncDisplayText = (syncType, isLoading) => {
  if (syncType === 'rebuild') {
    return {
      buttonText: isLoading ? 'Rebuilding...' : 'Full Rebuild',
      description: isLoading 
        ? 'Completely rebuilding the file tree from disk...'
        : 'Completely rebuild the file tree from disk',
      successTitle: 'Project Tree Rebuilt',
      successDescription: 'Rebuilt project with all files and folders.',
    };
  }
  
  return {
    buttonText: isLoading ? 'Syncing...' : 'Quick Sync',
    description: isLoading 
      ? 'Finding new files created by Python scripts...'
      : 'Find new files created by Python scripts',
    successTitle: 'Files Synced Successfully',
    successDescription: 'Found and imported new files created by your scripts.',
  };
};