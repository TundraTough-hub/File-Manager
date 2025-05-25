// src/components/FileSync/SyncResultsModal.jsx
// Modal for displaying sync results

import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  List,
  ListItem,
  ListIcon,
  Badge,
  Box,
} from '@chakra-ui/react';
import { FiCheck } from 'react-icons/fi';
import { 
  getFileIcon, 
  getFileIconColor, 
  getFileTypeDescription, 
  formatFileSize 
} from './utils/syncUtils';

const SyncResultsModal = ({
  isOpen,
  onClose,
  syncedFiles = [],
  syncType = 'normal',
  summary = null,
}) => {
  const isRebuild = syncType === 'rebuild';
  const hasFiles = syncedFiles.length > 0;

  const getModalTitle = () => {
    return isRebuild ? 'Project Tree Rebuilt' : 'Files Synced Successfully';
  };

  const getSuccessMessage = () => {
    if (!hasFiles) {
      return isRebuild 
        ? 'The project tree has been rebuilt but no files were found.'
        : 'Your project is already up to date. No new files were found.';
    }

    return isRebuild 
      ? `Rebuilt project tree with ${syncedFiles.length} file(s) and folder(s).`
      : `Found and imported ${syncedFiles.length} new file(s) created by your Python scripts.`;
  };

  const getInfoMessage = () => {
    if (!hasFiles) return null;

    return isRebuild 
      ? 'The project file tree has been completely rebuilt from disk.'
      : 'These files are now part of your project and will appear in the file tree.';
  };

  const renderFileList = () => {
    if (!hasFiles) return null;

    return (
      <VStack align="stretch" spacing={2}>
        <Text fontWeight="medium">
          {isRebuild ? 'Project Contents:' : 'New Files Added:'}
        </Text>
        <List spacing={2} maxH="300px" overflowY="auto">
          {syncedFiles.map((file) => (
            <ListItem 
              key={file.id} 
              p={2} 
              borderRadius="md" 
              bg="gray.50" 
              _dark={{ bg: "gray.700" }}
            >
              <HStack spacing={3}>
                <ListIcon 
                  as={getFileIcon(file)} 
                  color={getFileIconColor(file)}
                />
                <VStack align="start" spacing={0} flex="1">
                  <Text fontSize="sm" fontWeight="medium">
                    {file.name}
                  </Text>
                  <HStack spacing={2}>
                    <Badge size="sm" colorScheme="blue">
                      {file.type}
                    </Badge>
                    {file.extension && (
                      <Badge size="sm" variant="outline">
                        .{file.extension}
                      </Badge>
                    )}
                    {file.size && (
                      <Text fontSize="xs" color="gray.500">
                        {formatFileSize(file.size)}
                      </Text>
                    )}
                    {file.file_path && (
                      <Text fontSize="xs" color="gray.500" isTruncated maxW="200px">
                        {file.file_path}
                      </Text>
                    )}
                  </HStack>
                </VStack>
              </HStack>
            </ListItem>
          ))}
        </List>
      </VStack>
    );
  };

  const renderSummary = () => {
    if (!summary) return null;

    return (
      <Box 
        p={3} 
        bg="blue.50" 
        borderRadius="md" 
        borderWidth="1px" 
        borderColor="blue.200"
        _dark={{ bg: "blue.900", borderColor: "blue.700" }}
      >
        <HStack justify="space-between" wrap="wrap" spacing={4}>
          <VStack align="start" spacing={1}>
            <Text fontSize="xs" color="gray.500" fontWeight="medium">FILES</Text>
            <Text fontSize="sm" fontWeight="semibold">{summary.fileCount}</Text>
          </VStack>
          <VStack align="start" spacing={1}>
            <Text fontSize="xs" color="gray.500" fontWeight="medium">FOLDERS</Text>
            <Text fontSize="sm" fontWeight="semibold">{summary.folderCount}</Text>
          </VStack>
          <VStack align="start" spacing={1}>
            <Text fontSize="xs" color="gray.500" fontWeight="medium">TOTAL SIZE</Text>
            <Text fontSize="sm" fontWeight="semibold">{summary.totalSize}</Text>
          </VStack>
        </HStack>
      </Box>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Icon as={FiCheck} color="green.500" />
            <Text>{getModalTitle()}</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Success Alert */}
            <Alert status={hasFiles ? "success" : "info"}>
              <AlertIcon />
              <AlertTitle>
                {isRebuild ? 'Rebuild Complete!' : 'Sync Complete!'}
              </AlertTitle>
              <AlertDescription>
                {getSuccessMessage()}
              </AlertDescription>
            </Alert>

            {/* Summary Statistics */}
            {hasFiles && renderSummary()}

            {/* File List */}
            {renderFileList()}

            {/* Info Message */}
            {getInfoMessage() && (
              <Alert status="info" size="sm">
                <AlertIcon />
                <Text fontSize="sm">
                  {getInfoMessage()}
                </Text>
              </Alert>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SyncResultsModal;