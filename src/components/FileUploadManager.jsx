// src/components/FileUploadManager.jsx - COMPLETELY FIXED VERSION
import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Progress,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Alert,
  AlertIcon,
  Flex,
  Icon,
  Badge,
} from '@chakra-ui/react';
import { 
  FiUpload, 
  FiFile, 
  FiFolder, 
  FiCheck, 
  FiX,
  FiDatabase,
  FiCode,
  FiFileText,
  FiAlertCircle,
  FiImage,
  FiArchive,
  FiVideo,
  FiMusic,
} from 'react-icons/fi';
import { invoke } from '@tauri-apps/api/tauri';

const FileUploadManager = ({ 
  projectId, 
  currentFolderId,  // This might be the selected folder in the UI
  onFileUploaded, 
  onFolderUploaded,
  nodes = [],  // All nodes to help determine correct parent
  rootId = null  // Project root ID
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [errors, setErrors] = useState([]);
  const toast = useToast();

  const validateUpload = (filePath) => {
    if (!projectId) {
      throw new Error('No project selected');
    }
    if (!filePath) {
      throw new Error('No file selected');
    }
    return true;
  };

  // FIXED: Helper function to determine the correct parent ID for the frontend
  const getCorrectParentId = () => {
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

  const handleFileUpload = async () => {
    try {
      setErrors([]);
      setUploading(true);
      setUploadProgress(10);

      console.log('🚀 FIXED: Starting file upload');
      console.log('🚀 FIXED: projectId:', projectId);
      console.log('🚀 FIXED: currentFolderId:', currentFolderId);
      console.log('🚀 FIXED: Available nodes:', nodes.length);

      // Open file dialog
      const filePath = await invoke('show_file_dialog');
      
      if (!filePath) {
        console.log('🚀 FIXED: User cancelled file selection');
        setUploading(false);
        setUploadProgress(0);
        return;
      }

      console.log('🚀 FIXED: Selected file:', filePath);

      validateUpload(filePath);
      setUploadProgress(25);

      // FIXED: For the backend call, we'll pass empty string to indicate project root
      // The backend will handle placing the file in the correct location
      const backendParentFolder = '';

      console.log('🚀 FIXED: Backend parent folder (empty = project root):', backendParentFolder);

      // Import the file through backend
      const result = await invoke('import_file', {
        projectId,
        parentFolder: backendParentFolder,
        sourcePath: filePath,
      });

      console.log('🚀 FIXED: Backend import result:', result);
      setUploadProgress(75);

      // FIXED: Determine the correct parent ID for the frontend node
      const correctParentId = getCorrectParentId();

      // FIXED: Create comprehensive node data for the frontend
      const newNode = {
        id: result.node_id,
        name: result.name,
        type: result.type || 'file',
        extension: result.extension || null,
        parent_id: correctParentId,  // FIXED: Use the determined parent ID
        parentId: correctParentId,   // FIXED: Both variants for compatibility
        project_id: projectId,
        projectId: projectId,
        file_path: result.file_path || result.name,  // FIXED: Use backend-provided path
        size: result.size || 0,
        hidden: false,
        shouldRename: false,
        is_binary: result.is_binary || false,
      };

      console.log('🚀 FIXED: Created newNode with parent_id:', newNode.parent_id);
      console.log('🚀 FIXED: Full newNode:', newNode);
      setUploadProgress(90);

      setUploadedFiles(prev => [...prev, { ...newNode, uploadTime: new Date() }]);

      // Notify parent component
      if (onFileUploaded) {
        console.log('🚀 FIXED: Calling onFileUploaded with properly parented node');
        onFileUploaded(newNode);
        console.log('🚀 FIXED: onFileUploaded call completed');
      } else {
        console.log('🚀 FIXED: ERROR - onFileUploaded is not defined!');
      }

      setUploadProgress(100);

      const fileTypeInfo = result.is_binary ? ' (binary file)' : ' (text file)';
      toast({
        title: 'File uploaded successfully',
        description: `${result.name}${fileTypeInfo} has been added to your project`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error('🚀 FIXED: Upload failed with error:', error);
      const errorMessage = error.toString();
      setErrors(prev => [...prev, errorMessage]);
      
      toast({
        title: 'Upload failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setErrors([]);
      }, 2000);
    }
  };

  const handleFolderUpload = async () => {
    try {
      setErrors([]);
      setUploading(true);
      setUploadProgress(10);

      console.log('📁 FIXED: Starting folder upload');

      // Open folder dialog
      const folderPath = await invoke('show_folder_dialog');
      
      if (!folderPath) {
        console.log('📁 FIXED: User cancelled folder selection');
        setUploading(false);
        setUploadProgress(0);
        return;
      }

      console.log('📁 FIXED: Selected folder:', folderPath);

      validateUpload(folderPath);
      setUploadProgress(25);

      // FIXED: For the backend call, use empty string for project root
      const backendParentFolder = '';

      // Import the folder through backend
      const result = await invoke('import_folder', {
        projectId,
        parentFolder: backendParentFolder,
        sourcePath: folderPath,
      });

      console.log('📁 FIXED: Backend import result:', result);
      setUploadProgress(75);

      // FIXED: Determine the correct parent ID for the frontend node
      const correctParentId = getCorrectParentId();

      // FIXED: Create comprehensive node data for the frontend
      const newNode = {
        id: result.node_id,
        name: result.name,
        type: result.type || 'folder',
        extension: null,
        parent_id: correctParentId,  // FIXED: Use the determined parent ID
        parentId: correctParentId,   // FIXED: Both variants for compatibility
        project_id: projectId,
        projectId: projectId,
        file_path: result.file_path || result.name,  // FIXED: Use backend-provided path
        size: result.size || 0,
        hidden: false,
        shouldRename: false,
        is_binary: false,
      };

      console.log('📁 FIXED: Created newNode with parent_id:', newNode.parent_id);
      console.log('📁 FIXED: Full newNode:', newNode);
      setUploadProgress(100);
      setUploadedFiles(prev => [...prev, { ...newNode, uploadTime: new Date() }]);

      // Notify parent component
      if (onFolderUploaded) {
        console.log('📁 FIXED: Calling onFolderUploaded with properly parented node');
        onFolderUploaded(newNode);
        console.log('📁 FIXED: onFolderUploaded call completed');
      }

      toast({
        title: 'Folder uploaded successfully',
        description: `${result.name} and its contents have been added to your project`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error('📁 FIXED: Folder upload failed:', error);
      const errorMessage = error.toString();
      setErrors(prev => [...prev, errorMessage]);
      
      toast({
        title: 'Folder upload failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setErrors([]);
      }, 2000);
    }
  };

  const clearUploadHistory = () => {
    setUploadedFiles([]);
    setErrors([]);
  };

  const getFileIcon = (file) => {
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

  const getFileIconColor = (file) => {
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

  const getFileTypeDescription = (file) => {
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUploadTime = (uploadTime) => {
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

  return (
    <>
      <VStack spacing={2} align="stretch">
        <HStack spacing={2}>
          <Button
            leftIcon={<FiUpload />}
            size="sm"
            colorScheme="blue"
            variant="outline"
            onClick={handleFileUpload}
            isLoading={uploading}
            loadingText="Uploading"
            isDisabled={!projectId}
          >
            Upload File
          </Button>
          
          <Button
            leftIcon={<FiFolder />}
            size="sm"
            colorScheme="green"
            variant="outline"
            onClick={handleFolderUpload}
            isLoading={uploading}
            loadingText="Uploading"
            isDisabled={!projectId}
          >
            Upload Folder
          </Button>

          {(uploadedFiles.length > 0 || errors.length > 0) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onOpen}
            >
              View History ({uploadedFiles.length + errors.length})
            </Button>
          )}
        </HStack>

        {!projectId && (
          <Alert status="warning" size="sm">
            <AlertIcon />
            <Text fontSize="xs">Select a project to upload files</Text>
          </Alert>
        )}

        {uploading && uploadProgress > 0 && (
          <Box w="100%">
            <Progress 
              value={uploadProgress} 
              size="sm" 
              colorScheme="blue"
              isAnimated
              hasStripe={uploadProgress < 100}
            />
            <Text fontSize="xs" color="gray.600" mt={1}>
              {uploadProgress < 100 ? 'Uploading...' : 'Complete!'}
            </Text>
          </Box>
        )}

        {errors.length > 0 && (
          <Alert status="error" size="sm">
            <AlertIcon />
            <Text fontSize="xs">{errors[errors.length - 1]}</Text>
          </Alert>
        )}
      </VStack>

      {/* Upload History Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload History</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {(uploadedFiles.length > 0 || errors.length > 0) ? (
              <VStack spacing={3} align="stretch" maxH="400px" overflowY="auto">
                {/* Successful uploads */}
                {uploadedFiles.map((file, index) => (
                  <Flex
                    key={`success-${file.id}-${index}`}
                    align="center"
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    bg="green.50"
                    borderColor="green.200"
                    _dark={{ 
                      bg: "green.900",
                      borderColor: "green.700"
                    }}
                  >
                    <Icon 
                      as={getFileIcon(file)} 
                      mr={3} 
                      color={getFileIconColor(file)}
                      boxSize={5}
                    />
                    <Box flex="1">
                      <Flex align="center" gap={2}>
                        <Text fontWeight="medium" fontSize="sm">{file.name}</Text>
                        {file.is_binary && (
                          <Badge colorScheme="blue" size="sm">Binary</Badge>
                        )}
                      </Flex>
                      <HStack spacing={2} fontSize="xs" color="gray.600">
                        <Text>{getFileTypeDescription(file)}</Text>
                        <Text>•</Text>
                        <Text>{formatFileSize(file.size)}</Text>
                        <Text>•</Text>
                        <Text>{formatUploadTime(file.uploadTime)}</Text>
                      </HStack>
                    </Box>
                    <Icon as={FiCheck} color="green.500" boxSize={4} />
                  </Flex>
                ))}

                {/* Upload errors */}
                {errors.map((error, index) => (
                  <Flex
                    key={`error-${index}`}
                    align="center"
                    p={3}
                    borderWidth="1px"
                    borderRadius="md"
                    bg="red.50"
                    borderColor="red.200"
                    _dark={{ 
                      bg: "red.900",
                      borderColor: "red.700"
                    }}
                  >
                    <Icon as={FiAlertCircle} mr={3} color="red.500" boxSize={5} />
                    <Box flex="1">
                      <Text fontWeight="medium" fontSize="sm" color="red.600">
                        Upload Failed
                      </Text>
                      <Text fontSize="xs" color="red.500">
                        {error}
                      </Text>
                    </Box>
                    <Icon as={FiX} color="red.500" boxSize={4} />
                  </Flex>
                ))}
              </VStack>
            ) : (
              <Text color="gray.500" textAlign="center" py={8}>
                No uploads yet
              </Text>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack>
              {(uploadedFiles.length > 0 || errors.length > 0) && (
                <Button variant="ghost" onClick={clearUploadHistory} size="sm">
                  Clear History
                </Button>
              )}
              <Button onClick={onClose}>Close</Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default FileUploadManager;