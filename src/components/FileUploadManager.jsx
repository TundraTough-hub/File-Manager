// src/components/FileUploadManager.jsx - Updated to use modular components
import React from 'react';
import {
  VStack,
  Text,
  Alert,
  AlertIcon,
  useColorModeValue,
} from '@chakra-ui/react';
import UploadControls from './FileUpload/UploadControls';
import UploadProgress from './FileUpload/UploadProgress';
import UploadHistory from './FileUpload/UploadHistory';
import { useFileUpload } from './FileUpload/hooks/useFileUpload';

const FileUploadManager = ({ 
  projectId, 
  currentFolderId,
  onFileUploaded, 
  onFolderUploaded,
  nodes = [],
  rootId = null 
}) => {
  const {
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
  } = useFileUpload({
    projectId,
    currentFolderId,
    onFileUploaded,
    onFolderUploaded,
    nodes,
    rootId,
  });

  return (
    <VStack spacing={2} align="stretch">
      {/* Upload Controls */}
      <UploadControls
        uploading={uploading}
        projectId={projectId}
        onFileUpload={handleFileUpload}
        onFolderUpload={handleFolderUpload}
        hasRecentActivity={hasRecentActivity}
        onShowHistory={onHistoryOpen}
        uploadedFiles={uploadedFiles}
        errors={errors}
      />

      {/* Project Selection Warning */}
      {!projectId && (
        <Alert status="warning" size="sm">
          <AlertIcon />
          <Text fontSize="xs">Select a project to upload files</Text>
        </Alert>
      )}

      {/* Upload Progress */}
      <UploadProgress
        uploading={uploading}
        uploadProgress={uploadProgress}
        errors={errors}
      />

      {/* Upload History Modal */}
      <UploadHistory
        isOpen={isHistoryOpen}
        onClose={onHistoryClose}
        uploadedFiles={uploadedFiles}
        errors={errors}
        onClearHistory={clearUploadHistory}
      />
    </VStack>
  );
};

export default FileUploadManager;