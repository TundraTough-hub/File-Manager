// src/components/FileUpload/UploadHistory.jsx - FIXED IMPORT PATH
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
  Flex,
  Badge,
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { 
  FiCheck, 
  FiX, 
  FiAlertTriangle,
  FiTrash2,
} from 'react-icons/fi';

// FIXED: Changed from "../utils/fileUploadUtils" to "./utils/fileUploadUtils"
import {
  getFileIcon,
  getFileIconColor,
  getFileTypeDescription,
  formatFileSize,
  formatUploadTime
} from "./utils/fileUploadUtils";

const UploadHistory = ({
  isOpen,
  onClose,
  uploadedFiles = [],
  errors = [],
  onClearHistory,
}) => {
  const hasContent = uploadedFiles.length > 0 || errors.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Upload History</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {hasContent ? (
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
                  <Icon as={FiAlertTriangle} mr={3} color="red.500" boxSize={5} />
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
            {hasContent && (
              <Button 
                variant="ghost" 
                onClick={onClearHistory} 
                size="sm"
                leftIcon={<FiTrash2 />}
              >
                Clear History
              </Button>
            )}
            <Button onClick={onClose}>Close</Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UploadHistory;