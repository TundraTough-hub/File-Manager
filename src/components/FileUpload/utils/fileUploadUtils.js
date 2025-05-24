// src/components/FileUpload/utils/fileUploadUtils.js - Upload helper functions
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

// Validation functions
export const validateUpload = (filePath, projectId) => {
  if (!projectId) {
    throw new Error('No project selected');
  }
  if (!filePath) {
    throw new Error('No file selected');
  }
  return true;
};

// Helper function to determine the correct parent ID for the frontend
export const getCorrectParentId = (currentFolderId, rootId, nodes, projectId) => {
  console.log('🔍 FIXED: Determining correct parent ID');
  console.log('🔍 FIXED: currentFolderId:', currentFolderId);
  console.log('🔍 FIXED: rootId:', rootId);
  console.log('🔍 FIXED: projectId:', projectId);
  
  // If we have a selected folder that's not the hidden root, use it
  if (currentFolderId && currentFolderId !== rootId) {
    const selectedNode = nodes.find(n => n.id === currentFolderId);
    console.log('🔍 FIXED: Selected node:', selectedNode);
    
    if (selectedNode && selectedNode.type === 'folder' && !selectedNode.hidden) {
      console.log('🔍 FIXED: Using selected visible folder as parent:', currentFolderId);
      return currentFolderId;
    }
  }
  
  // Find the hidden root folder for this project
  const hiddenRoot = nodes.find(n => 
    (n.project_id === projectId || n.projectId === projectId) && 
    (n.hidden === true || n.name === '__PROJECT_ROOT__')
  );
  
  console.log('🔍 FIXED: Found hidden root:', hiddenRoot);
  
  if (hiddenRoot) {
    console.log('🔍 FIXED: Using hidden root as parent:', hiddenRoot.id);
    return hiddenRoot.id;
  }
  
  // This shouldn't happen, but fallback to null
  console.log('🔍 FIXED: No suitable parent found, using null');
  return null;
};

// Create node from backend result
export const createNodeFromResult = (result, correctParentId, projectId, type = null) => {
  return {
    id: result.node_id,
    name: result.name,
    type: type || result.type || 'file',
    extension: result.extension || null,
    parent_id: correctParentId,
    parentId: correctParentId,
    project_id: projectId,
    projectId: projectId,
    file_path: result.file_path || result.name,
    size: result.size || 0,
    hidden: false,
    shouldRename: false,
    is_binary: result.is_binary || false,
  };
};

// File icon utilities
export const getFileIcon = (file) => {
  if (file.type === 'folder') return FiFolder;
  
  const ext = file.extension?.toLowerCase();
  if (!ext) return FiFile;
  
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return FiFileText;
  if (['csv', 'json', 'xml'].includes(ext)) return FiDatabase;
  if (['py', 'js', 'html', 'css', 'ipynb'].includes(ext)) return FiCode;
  if (['txt', 'md'].includes(ext)) return FiFileText;
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'webp'].includes(ext)) return FiImage;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return FiArchive;
  if (['mp3', 'wav', 'flac', 'ogg', 'aac'].includes(ext)) return FiMusic;
  if (['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(ext)) return FiVideo;
  
  return FiFile;
};

export const getFileIconColor = (file) => {
  if (file.type === 'folder') return 'yellow.500';
  
  const ext = file.extension?.toLowerCase();
  if (!ext) return 'gray.500';
  
  if (['pdf', 'doc', 'docx'].includes(ext)) return 'red.500';
  if (['xls', 'xlsx'].includes(ext)) return 'green.600';
  if (['ppt', 'pptx'].includes(ext)) return 'orange.500';
  if (['csv'].includes(ext)) return 'green.500';
  if (['json'].includes(ext)) return 'yellow.600';
  if (['xml'].includes(ext)) return 'orange.600';
  if (['py'].includes(ext)) return 'blue.500';
  if (['js'].includes(ext)) return 'yellow.500';
  if (['html'].includes(ext)) return 'orange.500';
  if (['css'].includes(ext)) return 'blue.400';
  if (['ipynb'].includes(ext)) return 'orange.600';
  if (['txt'].includes(ext)) return 'gray.600';
  if (['md'].includes(ext)) return 'blue.400';
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'webp'].includes(ext)) return 'pink.500';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'orange.700';
  if (['mp3', 'wav', 'flac', 'ogg', 'aac'].includes(ext)) return 'purple.500';
  if (['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(ext)) return 'red.400';
  
  return 'gray.500';
};

export const getFileTypeDescription = (file) => {
  if (file.type === 'folder') return 'Folder';
  
  const ext = file.extension?.toLowerCase();
  if (!ext) return 'File';
  
  const typeMap = {
    'pdf': 'PDF Document', 'doc': 'Word Document', 'docx': 'Word Document',
    'xls': 'Excel Spreadsheet', 'xlsx': 'Excel Spreadsheet', 'ppt': 'PowerPoint', 'pptx': 'PowerPoint',
    'csv': 'CSV Data', 'json': 'JSON Data', 'xml': 'XML Data',
    'py': 'Python Script', 'js': 'JavaScript', 'html': 'HTML Document', 'css': 'CSS Stylesheet', 'ipynb': 'Jupyter Notebook',
    'txt': 'Text File', 'md': 'Markdown',
    'jpg': 'JPEG Image', 'jpeg': 'JPEG Image', 'png': 'PNG Image', 'gif': 'GIF Image', 'svg': 'SVG Image',
    'zip': 'ZIP Archive', 'rar': 'RAR Archive', '7z': '7-Zip Archive',
    'mp3': 'MP3 Audio', 'wav': 'WAV Audio', 'mp4': 'MP4 Video', 'avi': 'AVI Video',
  };
  
  return typeMap[ext] || `${ext.toUpperCase()} File`;
};

// Formatting utilities
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatUploadTime = (uploadTime) => {
  if (!uploadTime) return '';
  const now = new Date();
  const diffMs = now - uploadTime;
  const diffMinutes = Math.floor(diffMs / 60000);
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return uploadTime.toLocaleDateString();
};