// src/components/FileUpload/UploadControls.jsx - Upload buttons and controls
import React from 'react';
import {
  HStack,
  Button,
} from '@chakra-ui/react';
import { 
  FiUpload, 
  FiFolder,
} from 'react-icons/fi';

const UploadControls = ({
  uploading,
  projectId,
  onFileUpload,
  onFolderUpload,
  hasRecentActivity,
  onShowHistory,
  uploadedFiles,
  errors,
}) => {
  return (
    <HStack spacing={2}>
      <Button
        leftIcon={<FiUpload />}
        size="sm"
        colorScheme="blue"
        variant="outline"
        onClick={onFileUpload}
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
        onClick={onFolderUpload}
        isLoading={uploading}
        loadingText="Uploading"
        isDisabled={!projectId}
      >
        Upload Folder
      </Button>

      {hasRecentActivity && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onShowHistory}
        >
          View History ({uploadedFiles.length + errors.length})
        </Button>
      )}
    </HStack>
  );
};

export default UploadControls;