// src/components/FileUpload/UploadProgress.jsx - Upload progress display
import React from 'react';
import {
  Box,
  Text,
  Progress,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';

const UploadProgress = ({
  uploading,
  uploadProgress,
  errors,
}) => {
  // Only show progress when actively uploading
  if (!uploading && uploadProgress === 0 && errors.length === 0) {
    return null;
  }

  return (
    <Box w="100%">
      {/* Upload Progress Bar */}
      {uploading && uploadProgress > 0 && (
        <Box>
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

      {/* Error Display */}
      {errors.length > 0 && (
        <Alert status="error" size="sm">
          <AlertIcon />
          <Text fontSize="xs">{errors[errors.length - 1]}</Text>
        </Alert>
      )}
    </Box>
  );
};

export default UploadProgress;