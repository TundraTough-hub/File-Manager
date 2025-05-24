// src/utils/fileIcons.js - Enhanced file type detection for Python data workflows
import { 
  FiFolder, 
  FiFile, 
  FiCode,
  FiFileText,
  FiBook,
  FiDatabase,
  FiImage,
  FiGlobe,
  FiGrid,
  FiDownload,
  FiBarChart3,
  FiSettings,
  FiArchive,
  FiVideo,
  FiMusic,
} from 'react-icons/fi';

export const getFileIcon = (node) => {
  if (node.type === 'folder') {
    return FiFolder;
  }
  
  if (!node.extension) {
    return FiFile;
  }
  
  const ext = node.extension.toLowerCase();
  
  // Python files
  if (ext === 'py') return FiCode;
  if (ext === 'ipynb') return FiBook;
  if (ext === 'pyx' || ext === 'pyi') return FiCode;
  
  // Data files
  if (['csv', 'tsv'].includes(ext)) return FiDatabase;
  if (['xlsx', 'xls', 'xlsm'].includes(ext)) return FiGrid;
  if (['json', 'jsonl', 'ndjson'].includes(ext)) return FiDatabase;
  if (['parquet', 'feather'].includes(ext)) return FiDatabase;
  if (['h5', 'hdf5', 'hdf'].includes(ext)) return FiDatabase;
  if (['sqlite', 'db', 'sqlite3'].includes(ext)) return FiDatabase;
  if (['pkl', 'pickle'].includes(ext)) return FiArchive;
  
  // Configuration files
  if (['yaml', 'yml', 'toml', 'ini', 'cfg', 'conf'].includes(ext)) return FiSettings;
  if (['env', 'envrc'].includes(ext)) return FiSettings;
  if (['requirements.txt', 'pipfile', 'pyproject.toml'].includes(node.name.toLowerCase())) return FiSettings;
  
  // Documentation
  if (['md', 'rst', 'txt'].includes(ext)) return FiFileText;
  if (['pdf', 'doc', 'docx'].includes(ext)) return FiFileText;
  if (['rtf', 'odt'].includes(ext)) return FiFileText;
  
  // Add after line 50 (after existing extensions):
  if (['r', 'rmd'].includes(ext)) return FiCode; // R files
  if (['sql'].includes(ext)) return FiDatabase; // SQL files
  if (['yaml', 'yml'].includes(ext)) return FiSettings; // Config files
  if (['log'].includes(ext)) return FiFileText; // Log files
  if (['sh', 'bat', 'cmd'].includes(ext)) return FiTerminal; // Scripts

  // Web files
  if (['html', 'htm', 'xml'].includes(ext)) return FiGlobe;
  if (['css', 'scss', 'sass', 'less'].includes(ext)) return FiGlobe;
  if (['js', 'ts', 'jsx', 'tsx'].includes(ext)) return FiGlobe;
  
  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) return FiImage;
  if (['svg', 'ico', 'tiff', 'tif'].includes(ext)) return FiImage;
  
  // Charts and plots
  if (['svg', 'eps', 'ps'].includes(ext)) return FiBarChart3;
  
  // Archives
  if (['zip', 'tar', 'gz', 'bz2', 'xz', '7z', 'rar'].includes(ext)) return FiArchive;
  
  // Media
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) return FiVideo;
  if (['mp3', 'wav', 'flac', 'ogg', 'aac'].includes(ext)) return FiMusic;
  
  // Downloads/executables
  if (['exe', 'msi', 'dmg', 'pkg', 'deb', 'rpm'].includes(ext)) return FiDownload;
  
  return FiFile;
};

export const getFileIconColor = (node) => {
  if (node.type === 'folder') {
    return 'yellow.500';
  }
  
  if (!node.extension) {
    return 'gray.500';
  }
  
  const ext = node.extension.toLowerCase();
  
  // Python files - blue shades
  if (ext === 'py') return 'blue.600';
  if (ext === 'ipynb') return 'orange.500';
  if (ext === 'pyx' || ext === 'pyi') return 'blue.400';
  
  // Data files - green shades
  if (['csv', 'tsv'].includes(ext)) return 'green.600';
  if (['xlsx', 'xls', 'xlsm'].includes(ext)) return 'green.500';
  if (['json', 'jsonl', 'ndjson'].includes(ext)) return 'green.400';
  if (['parquet', 'feather', 'h5', 'hdf5', 'hdf'].includes(ext)) return 'green.700';
  if (['sqlite', 'db', 'sqlite3'].includes(ext)) return 'teal.600';
  if (['pkl', 'pickle'].includes(ext)) return 'purple.500';
  
  // Configuration files - gray/slate
  if (['yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'env', 'envrc'].includes(ext)) return 'gray.600';
  
  // Documentation - blue-gray
  if (['md', 'rst', 'txt'].includes(ext)) return 'blue.400';
  if (['pdf', 'doc', 'docx', 'rtf', 'odt'].includes(ext)) return 'red.500';
  
  // Web files - orange/yellow
  if (['html', 'htm', 'xml'].includes(ext)) return 'orange.500';
  if (['css', 'scss', 'sass', 'less'].includes(ext)) return 'cyan.500';
  if (['js', 'ts', 'jsx', 'tsx'].includes(ext)) return 'yellow.500';
  
  // Images - pink/purple
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'].includes(ext)) return 'pink.500';
  
  // Charts - chart colors
  if (['svg', 'eps', 'ps'].includes(ext)) return 'purple.600';
  
  // Archives - brown/amber
  if (['zip', 'tar', 'gz', 'bz2', 'xz', '7z', 'rar'].includes(ext)) return 'amber.600';
  
  // Media - media colors
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) return 'red.400';
  if (['mp3', 'wav', 'flac', 'ogg', 'aac'].includes(ext)) return 'purple.400';
  
  // Downloads/executables
  if (['exe', 'msi', 'dmg', 'pkg', 'deb', 'rpm'].includes(ext)) return 'gray.700';
  
  return 'gray.500';
};

export const getFileTypeLabel = (node) => {
  if (node.type === 'folder') {
    return 'Folder';
  }
  
  if (!node.extension) {
    return 'File';
  }
  
  const ext = node.extension.toLowerCase();
  
  const fileTypeMap = {
    // Python
    'py': 'Python Script',
    'ipynb': 'Jupyter Notebook',
    'pyx': 'Cython File',
    'pyi': 'Python Interface',
    
    // Data formats
    'csv': 'CSV Data',
    'tsv': 'Tab-Separated Values',
    'xlsx': 'Excel Workbook',
    'xls': 'Excel File',
    'xlsm': 'Excel Macro File',
    'json': 'JSON Data',
    'jsonl': 'JSON Lines',
    'ndjson': 'Newline Delimited JSON',
    'parquet': 'Parquet Data',
    'feather': 'Feather Data',
    'h5': 'HDF5 Data',
    'hdf5': 'HDF5 Data',
    'hdf': 'HDF Data',
    'sqlite': 'SQLite Database',
    'db': 'Database File',
    'sqlite3': 'SQLite3 Database',
    'pkl': 'Pickle Data',
    'pickle': 'Pickle Data',
    
    // Configuration
    'yaml': 'YAML Config',
    'yml': 'YAML Config',
    'toml': 'TOML Config',
    'ini': 'INI Config',
    'cfg': 'Config File',
    'conf': 'Config File',
    'env': 'Environment File',
    'envrc': 'Environment File',
    
    // Documentation
    'md': 'Markdown',
    'rst': 'reStructuredText',
    'txt': 'Text File',
    'pdf': 'PDF Document',
    'doc': 'Word Document',
    'docx': 'Word Document',
    'rtf': 'Rich Text',
    'odt': 'OpenDocument Text',
    
    // Web
    'html': 'HTML File',
    'htm': 'HTML File',
    'xml': 'XML File',
    'css': 'Stylesheet',
    'scss': 'Sass Stylesheet',
    'sass': 'Sass Stylesheet',
    'less': 'Less Stylesheet',
    'js': 'JavaScript',
    'ts': 'TypeScript',
    'jsx': 'React Component',
    'tsx': 'TypeScript React',
    
    // Images
    'jpg': 'JPEG Image',
    'jpeg': 'JPEG Image',
    'png': 'PNG Image',
    'gif': 'GIF Image',
    'bmp': 'Bitmap Image',
    'webp': 'WebP Image',
    'svg': 'SVG Image',
    'ico': 'Icon File',
    'tiff': 'TIFF Image',
    'tif': 'TIFF Image',
    
    // Archives
    'zip': 'ZIP Archive',
    'tar': 'TAR Archive',
    'gz': 'Gzip Archive',
    'bz2': 'Bzip2 Archive',
    'xz': 'XZ Archive',
    '7z': '7-Zip Archive',
    'rar': 'RAR Archive',
    
    // Media
    'mp4': 'MP4 Video',
    'avi': 'AVI Video',
    'mov': 'QuickTime Video',
    'wmv': 'Windows Media Video',
    'flv': 'Flash Video',
    'webm': 'WebM Video',
    'mp3': 'MP3 Audio',
    'wav': 'WAV Audio',
    'flac': 'FLAC Audio',
    'ogg': 'OGG Audio',
    'aac': 'AAC Audio',
    
    // Executables
    'exe': 'Windows Executable',
    'msi': 'Windows Installer',
    'dmg': 'macOS Disk Image',
    'pkg': 'macOS Package',
    'deb': 'Debian Package',
    'rpm': 'RPM Package',
  };
  
  return fileTypeMap[ext] || `${node.extension.toUpperCase()} File`;
};