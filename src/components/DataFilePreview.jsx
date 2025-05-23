// src/components/DataFilePreview.jsx - Enhanced with binary file support
import React, { useState, useEffect } from 'react';
import {
  Box,
  Text,
  HStack,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  Icon,
  Button,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';
import { 
  FiFile,
  FiImage,
  FiVideo,
  FiMusic,
  FiArchive,
  FiFileText,
  FiDatabase,
  FiCode,
  FiDownload,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi';
import { invoke } from '@tauri-apps/api/tauri';

const DataFilePreview = ({ node, projectId }) => {
  const [fileContent, setFileContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileStats, setFileStats] = useState(null);
  const [showRawContent, setShowRawContent] = useState(false);

  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const loadPreview = async () => {
    if (!node || node.type !== 'file' || !projectId) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Get file stats first
      const stats = await invoke('get_file_stats', {
        projectId,
        filePath: node.file_path || node.name,
      });
      setFileStats(stats);
      
      // Only try to load content for non-binary files or if user wants to see raw content
      if (!stats.is_binary || showRawContent) {
        const content = await invoke('get_file_content', {
          nodeId: node.id,
          filePath: node.file_path || node.name,
          projectId,
        });
        
        // Truncate large files for preview
        const truncatedContent = content.length > 5000 
          ? content.substring(0, 5000) + '\n\n... (file truncated for preview - showing first 5000 characters)'
          : content;
          
        setFileContent(truncatedContent);
      } else {
        setFileContent('');
      }
      
    } catch (err) {
      setError(err.toString());
      setFileStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreview();
  }, [node?.id, projectId, showRawContent]);

  const getFileIcon = () => {
    if (!node?.extension) return FiFile;
    
    const ext = node.extension.toLowerCase();
    
    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'webp'].includes(ext)) return FiImage;
    
    // Video
    if (['mp4', 'avi', 'mov', 'wmv', 'webm', 'mkv'].includes(ext)) return FiVideo;
    
    // Audio
    if (['mp3', 'wav', 'flac', 'ogg', 'aac'].includes(ext)) return FiMusic;
    
    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) return FiArchive;
    
    // Documents
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return FiFileText;
    
    // Data files
    if (['csv', 'json', 'xml'].includes(ext)) return FiDatabase;
    
    // Code files
    if (['py', 'js', 'html', 'css', 'ipynb'].includes(ext)) return FiCode;
    
    // Text files
    if (['txt', 'md'].includes(ext)) return FiFileText;
    
    return FiFile;
  };

  const getFileIconColor = () => {
    if (!node?.extension) return 'gray.500';
    
    const ext = node.extension.toLowerCase();
    
    // Images - pink
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp', 'webp'].includes(ext)) return 'pink.500';
    
    // Video - red
    if (['mp4', 'avi', 'mov', 'wmv', 'webm', 'mkv'].includes(ext)) return 'red.400';
    
    // Audio - purple
    if (['mp3', 'wav', 'flac', 'ogg', 'aac'].includes(ext)) return 'purple.500';
    
    // Archives - brown
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) return 'orange.700';
    
    // Documents - red/orange
    if (['pdf'].includes(ext)) return 'red.500';
    if (['doc', 'docx'].includes(ext)) return 'blue.600';
    if (['xls', 'xlsx'].includes(ext)) return 'green.600';
    if (['ppt', 'pptx'].includes(ext)) return 'orange.500';
    
    // Data files - green
    if (['csv'].includes(ext)) return 'green.500';
    if (['json'].includes(ext)) return 'yellow.600';
    if (['xml'].includes(ext)) return 'orange.600';
    
    // Code files - blue
    if (['py'].includes(ext)) return 'blue.500';
    if (['js'].includes(ext)) return 'yellow.500';
    if (['html'].includes(ext)) return 'orange.500';
    if (['css'].includes(ext)) return 'blue.400';
    if (['ipynb'].includes(ext)) return 'orange.600';
    
    // Text files - gray/blue
    if (['txt'].includes(ext)) return 'gray.600';
    if (['md'].includes(ext)) return 'blue.400';
    
    return 'gray.500';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const isPreviewable = () => {
    if (!node?.extension) return false;
    const ext = node.extension.toLowerCase();
    return ['csv', 'json', 'txt', 'md', 'py', 'js', 'html', 'css', 'xml'].includes(ext);
  };

  const canShowAsText = () => {
    if (!fileStats) return false;
    return fileStats.is_binary && node?.extension;
  };

  if (!node || node.type !== 'file') {
    return (
      <Box p={6} textAlign="center" color="gray.500">
        <Icon as={FiFile} boxSize={12} mb={4} />
        <Text fontSize="lg" fontWeight="medium">Select a file to preview</Text>
        <Text fontSize="sm" mt={2}>File details and content will appear here</Text>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <Text>Loading file preview...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Preview Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={4}>
      {/* File Header */}
      <VStack align="stretch" spacing={4}>
        <Flex align="center" justify="space-between">
          <HStack spacing={3}>
            <Icon 
              as={getFileIcon()} 
              boxSize={8} 
              color={getFileIconColor()} 
            />
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold" fontSize="lg">{node.name}</Text>
              <HStack spacing={2}>
                {fileStats && (
                  <>
                    <Badge colorScheme={fileStats.is_binary ? "orange" : "green"}>
                      {fileStats.is_binary ? "Binary" : "Text"}
                    </Badge>
                    <Badge variant="outline">{fileStats.file_type}</Badge>
                  </>
                )}
              </HStack>
            </VStack>
          </HStack>
        </Flex>

        {/* File Stats */}
        {fileStats && (
          <Box 
            p={3} 
            bg={bgColor} 
            borderRadius="md" 
            borderWidth="1px" 
            borderColor={borderColor}
          >
            <HStack justify="space-between" wrap="wrap" spacing={4}>
              <VStack align="start" spacing={1}>
                <Text fontSize="xs" color="gray.500" fontWeight="medium">SIZE</Text>
                <Text fontSize="sm">{formatFileSize(fileStats.size)}</Text>
              </VStack>
              <VStack align="start" spacing={1}>
                <Text fontSize="xs" color="gray.500" fontWeight="medium">MODIFIED</Text>
                <Text fontSize="sm">{formatDate(fileStats.modified)}</Text>
              </VStack>
              <VStack align="start" spacing={1}>
                <Text fontSize="xs" color="gray.500" fontWeight="medium">TYPE</Text>
                <Text fontSize="sm">{fileStats.file_type}</Text>
              </VStack>
            </HStack>
          </Box>
        )}

        {/* Content Preview */}
        {fileStats?.is_binary && !showRawContent ? (
          <Box 
            p={6} 
            bg={bgColor} 
            borderRadius="md" 
            borderWidth="1px" 
            borderColor={borderColor}
            textAlign="center"
          >
            <Icon as={getFileIcon()} boxSize={16} color={getFileIconColor()} mb={4} />
            <Text fontSize="lg" fontWeight="medium" mb={2}>
              Binary File
            </Text>
            <Text fontSize="sm" color="gray.600" mb={4}>
              This is a binary file that cannot be displayed as text.
            </Text>
            <Text fontSize="xs" color="gray.500" mb={4}>
              File type: {fileStats.file_type} • Size: {formatFileSize(fileStats.size)}
            </Text>
            
            {canShowAsText() && (
              <Button
                leftIcon={showRawContent ? <FiEyeOff /> : <FiEye />}
                size="sm"
                variant="outline"
                onClick={() => setShowRawContent(!showRawContent)}
              >
                {showRawContent ? 'Hide Raw Content' : 'Show Raw Content'}
              </Button>
            )}
          </Box>
        ) : !isPreviewable() && !showRawContent ? (
          <Box 
            p={6} 
            bg={bgColor} 
            borderRadius="md" 
            borderWidth="1px" 
            borderColor={borderColor}
            textAlign="center"
          >
            <Icon as={getFileIcon()} boxSize={16} color={getFileIconColor()} mb={4} />
            <Text fontSize="lg" fontWeight="medium" mb={2}>
              Preview Not Available
            </Text>
            <Text fontSize="sm" color="gray.600" mb={4}>
              Preview is not supported for {node.extension?.toUpperCase() || 'this'} files.
            </Text>
            <Text fontSize="xs" color="gray.500">
              Use the download feature to save the file to your computer.
            </Text>
          </Box>
        ) : (
          <Box>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontWeight="medium" fontSize="sm">File Content</Text>
              <HStack spacing={2}>
                {fileStats?.is_binary && (
                  <Badge colorScheme="orange" size="sm">
                    Raw Binary Content
                  </Badge>
                )}
                <Text fontSize="xs" color="gray.500">
                  {fileContent.length} characters
                  {fileContent.includes('... (file truncated for preview') && ' (truncated)'}
                </Text>
              </HStack>
            </Flex>
            
            <Box
              as="pre"
              fontSize="sm"
              fontFamily="monospace"
              bg={bgColor}
              _dark={{ bg: 'gray.800', borderColor: 'gray.600' }}
              p={4}
              borderRadius="md"
              overflowX="auto"
              maxH="500px"
              overflowY="auto"
              whiteSpace="pre-wrap"
              border="1px solid"
              borderColor={borderColor}
              wordBreak="break-word"
            >
              {fileContent || 'File is empty'}
            </Box>

            {fileStats?.is_binary && showRawContent && (
              <Flex justify="center" mt={3}>
                <Button
                  leftIcon={<FiEyeOff />}
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowRawContent(false)}
                >
                  Hide Raw Content
                </Button>
              </Flex>
            )}
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default DataFilePreview;