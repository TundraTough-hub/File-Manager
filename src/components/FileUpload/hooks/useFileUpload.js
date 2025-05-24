// src/components/FileUpload/hooks/useFileUpload.js - Upload logic hook
import { useState, useCallback } from 'react';
import { useDisclosure, useToast } from '@chakra-ui/react';
import { invoke } from '@tauri-apps/api/tauri';
import { v4 as uuidv4 } from 'uuid';
import { validateUpload, getCorrectParentId, createNodeFromResult } from '../utils/fileUploadUtils';

export const useFileUpload = ({
  projectId,
  currentFolderId,
  onFileUploaded,
  onFolderUploaded,
  nodes = [],
  rootId = null,
}) => {
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [errors, setErrors] = useState([]);

  // History modal
  const { isOpen: isHistoryOpen, onOpen: onHistoryOpen, onClose: onHistoryClose } = useDisclosure();
  
  const toast = useToast();

  // Reset upload state
  const resetUploadState = useCallback(() => {
    setTimeout(() => {
      setUploadProgress(0);
      setErrors([]);
    }, 2000);
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async () => {
    try {
      setErrors([]);
      setUploading(true);
      setUploadProgress(10);

      console.log('🚀 FIXED: Starting file upload');
      console.log('🚀 FIXED: projectId:', projectId);
      console.log('🚀 FIXED: currentFolderId:', currentFolderId);

      // Open file dialog
      const filePath = await invoke('show_file_dialog');
      
      if (!filePath) {
        console.log('🚀 FIXED: User cancelled file selection');
        setUploading(false);
        setUploadProgress(0);
        return;
      }

      console.log('🚀 FIXED: Selected file:', filePath);
      validateUpload(filePath, projectId);
      setUploadProgress(25);

      // Import the file through backend
      const result = await invoke('import_file', {
        projectId,
        parentFolder: '', // Backend handles project root placement
        sourcePath: filePath,
      });

      console.log('🚀 FIXED: Backend import result:', result);
      setUploadProgress(75);

      // Determine the correct parent ID for the frontend node
      const correctParentId = getCorrectParentId(currentFolderId, rootId, nodes, projectId);

      // Create comprehensive node data for the frontend
      const newNode = createNodeFromResult(result, correctParentId, projectId);

      console.log('🚀 FIXED: Created newNode with parent_id:', newNode.parent_id);
      setUploadProgress(90);

      setUploadedFiles(prev => [...prev, { ...newNode, uploadTime: new Date() }]);

      // Notify parent component
      if (onFileUploaded) {
        console.log('🚀 FIXED: Calling onFileUploaded with properly parented node');
        onFileUploaded(newNode);
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
      resetUploadState();
    }
  }, [projectId, currentFolderId, nodes, rootId, onFileUploaded, toast, resetUploadState]);

  // Handle folder upload
  const handleFolderUpload = useCallback(async () => {
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
      validateUpload(folderPath, projectId);
      setUploadProgress(25);

      // Import the folder through backend
      const result = await invoke('import_folder', {
        projectId,
        parentFolder: '', // Backend handles project root placement
        sourcePath: folderPath,
      });

      console.log('📁 FIXED: Backend import result:', result);
      setUploadProgress(75);

      // Determine the correct parent ID for the frontend node
      const correctParentId = getCorrectParentId(currentFolderId, rootId, nodes, projectId);

      // Create comprehensive node data for the frontend
      const newNode = createNodeFromResult(result, correctParentId, projectId, 'folder');

      console.log('📁 FIXED: Created newNode with parent_id:', newNode.parent_id);
      setUploadProgress(100);
      setUploadedFiles(prev => [...prev, { ...newNode, uploadTime: new Date() }]);

      // Notify parent component
      if (onFolderUploaded) {
        console.log('📁 FIXED: Calling onFolderUploaded with properly parented node');
        onFolderUploaded(newNode);
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
      resetUploadState();
    }
  }, [projectId, currentFolderId, nodes, rootId, onFolderUploaded, toast, resetUploadState]);

  // Clear upload history
  const clearUploadHistory = useCallback(() => {
    setUploadedFiles([]);
    setErrors([]);
  }, []);

  // Check if there's recent activity
  const hasRecentActivity = uploadedFiles.length > 0 || errors.length > 0;

  return {
    // Upload state
    uploading,
    uploadProgress,
    uploadedFiles,
    errors,
    
    // History modal
    isHistoryOpen,
    onHistoryOpen,
    onHistoryClose,
    
    // Upload actions
    handleFileUpload,
    handleFolderUpload,
    clearUploadHistory,
    
    // Progress tracking
    hasRecentActivity,
  };
};