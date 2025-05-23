// src/components/FileDetails.jsx
import { Box, VStack, HStack, Text, Badge } from '@chakra-ui/react';
import { 
  FiFile, 
  FiCode, 
  FiFileText, 
  FiBook,
} from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

const FileDetails = ({ node }) => {
  const [fileStats, setFileStats] = useState({
    size: 0,
    modified: new Date(),
  });
  
  useEffect(() => {
    getFileStats();
  }, [node.id]);
  
  const getFileStats = async () => {
    try {
      const content = await invoke('get_file_content', { nodeId: node.id });
      setFileStats({
        size: new Blob([content]).size,
        modified: new Date(),
      });
    } catch (error) {
      console.error('Failed to get file stats:', error);
    }
  };
  
  const getFileTypeIcon = () => {
    if (!node.extension) return FiFile;
    const ext = node.extension.toLowerCase();
    if (ext === 'py') return FiCode;
    if (ext === 'ipynb') return FiBook;
    if (['txt', 'md'].includes(ext)) return FiFileText;
    return FiFile;
  };
  
  const getFileTypeLabel = () => {
    if (!node.extension) return 'File';
    const ext = node.extension.toLowerCase();
    
    const fileTypes = {
      'py': 'Python Script',
      'ipynb': 'Jupyter Notebook',
      'txt': 'Text File',
      'md': 'Markdown File',
      'json': 'JSON File',
      'csv': 'CSV File',
      'html': 'HTML File',
      'css': 'CSS File',
      'js': 'JavaScript File',
    };
    
    return fileTypes[ext] || `${node.extension.toUpperCase()} File`;
  };
  
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <Box p={4} borderWidth="1px" borderRadius="md">
      <VStack align="stretch" spacing={4}>
        <HStack>
          <Box as={getFileTypeIcon()} size="24px" color="blue.500" />
          <Text fontWeight="bold">{node.name}</Text>
        </HStack>
        
        <Box>
          <Text fontSize="sm" color="gray.500">Type</Text>
          <Badge colorScheme="blue" mt={1}>{getFileTypeLabel()}</Badge>
        </Box>
        
        <Box>
          <Text fontSize="sm" color="gray.500">Size</Text>
          <Text>{formatSize(fileStats.size)}</Text>
        </Box>
        
        <Box>
          <Text fontSize="sm" color="gray.500">Last Modified</Text>
          <Text>{fileStats.modified.toLocaleString()}</Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default FileDetails;