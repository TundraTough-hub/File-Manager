// src/components/Debug/OrphanDetector.jsx
// Component for detecting and managing orphaned files

import React, { useState } from 'react';
import {
  VStack,
  HStack,
  Text,
  Button,
  ButtonGroup,
  Checkbox,
  Alert,
  AlertIcon,
  Badge,
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Code,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Tooltip,
} from '@chakra-ui/react';
import { 
  FiAlertTriangle,
  FiTrash2,
  FiMove,
  FiTool,
  FiFile,
} from 'react-icons/fi';

const OrphanDetector = ({ 
  currentProjectId,
  orphanedFiles,
  unassignedOrphanedFiles,
  projectRoot,
  getFileIcon,
  getFileIconColor,
  onDeleteOrphans,
  onDeleteUnassigned,
  onRebuildProject,
  loading,
}) => {
  // Selection state for orphaned files
  const [selectedOrphanIds, setSelectedOrphanIds] = useState([]);
  const [selectedUnassignedIds, setSelectedUnassignedIds] = useState([]);
  
  // Modal state
  const { 
    isOpen: isDeleteModalOpen, 
    onOpen: onDeleteModalOpen, 
    onClose: onDeleteModalClose 
  } = useDisclosure();

  // Handle orphan selection
  const handleOrphanSelection = (orphanId, isChecked) => {
    if (isChecked) {
      setSelectedOrphanIds(prev => [...prev, orphanId]);
    } else {
      setSelectedOrphanIds(prev => prev.filter(id => id !== orphanId));
    }
  };

  // Handle unassigned selection
  const handleUnassignedSelection = (id, isChecked) => {
    if (isChecked) {
      setSelectedUnassignedIds(prev => [...prev, id]);
    } else {
      setSelectedUnassignedIds(prev => prev.filter(i => i !== id));
    }
  };

  // Select all orphans
  const selectAllOrphans = () => {
    setSelectedOrphanIds(orphanedFiles.map(f => f.id));
  };

  // Clear orphan selection
  const clearOrphanSelection = () => {
    setSelectedOrphanIds([]);
  };

  // Select all unassigned
  const selectAllUnassigned = () => {
    setSelectedUnassignedIds(unassignedOrphanedFiles.map(f => f.id));
  };

  // Clear unassigned selection
  const clearUnassignedSelection = () => {
    setSelectedUnassignedIds([]);
  };

  // Handle delete confirmation
  const handleDeleteSelected = () => {
    onDeleteModalOpen();
  };

  // Confirm delete action
  const confirmDelete = async () => {
    const success = await onDeleteOrphans(selectedOrphanIds, orphanedFiles, currentProjectId);
    if (success) {
      setSelectedOrphanIds([]);
      onDeleteModalClose();
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  // Handle unassigned delete
  const handleDeleteUnassigned = async () => {
    const success = await onDeleteUnassigned(selectedUnassignedIds, unassignedOrphanedFiles);
    if (success) {
      setSelectedUnassignedIds([]);
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  // Handle rebuild project
  const handleRebuildProject = async () => {
    try {
      await onRebuildProject(currentProjectId);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      // Error already handled in hook
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Project Orphaned Files Section */}
      {orphanedFiles.length > 0 ? (
        <Box border="1px solid" borderColor="red.300" borderRadius="md" p={4} bg="red.50" _dark={{ bg: "red.900" }}>
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
              <HStack>
                <FiAlertTriangle color="red" />
                <Text fontWeight="bold" color="red.700">
                  Orphaned Files Found ({orphanedFiles.length})
                </Text>
              </HStack>
              <HStack spacing={2}>
                <Button size="xs" onClick={selectAllOrphans}>Select All</Button>
                <Button size="xs" onClick={clearOrphanSelection}>Clear</Button>
              </HStack>
            </HStack>
            
            <Text fontSize="sm" color="red.600">
              These files have no parent folder (parent_id is null). They won't show up in the file tree.
            </Text>

            {/* Orphaned Files Table */}
            <Box maxH="250px" overflowY="auto" border="1px solid" borderColor="gray.300" borderRadius="md">
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th width="50px">Select</Th>
                    <Th>Name</Th>
                    <Th>Type</Th>
                    <Th>Extension</Th>
                    <Th>ID</Th>
                    <Th>File Path</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {orphanedFiles.map((file) => (
                    <Tr key={file.id}>
                      <Td>
                        <Checkbox
                          isChecked={selectedOrphanIds.includes(file.id)}
                          onChange={(e) => handleOrphanSelection(file.id, e.target.checked)}
                        />
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Icon as={getFileIcon(file)} color={getFileIconColor(file)} />
                          <Text fontSize="sm" fontWeight="medium">{file.name}</Text>
                        </HStack>
                      </Td>
                      <Td>
                        <Badge size="sm" colorScheme={file.type === 'folder' ? 'yellow' : 'blue'}>
                          {file.type}
                        </Badge>
                      </Td>
                      <Td>
                        {file.extension ? (
                          <Badge size="sm" variant="outline">.{file.extension}</Badge>
                        ) : (
                          <Text fontSize="xs" color="gray.500">none</Text>
                        )}
                      </Td>
                      <Td>
                        <Code fontSize="xs">{file.id.slice(0, 8)}...</Code>
                      </Td>
                      <Td>
                        <Text fontSize="xs" color="gray.600" maxW="150px" isTruncated>
                          {file.file_path || 'No path set'}
                        </Text>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>

            {/* Action Buttons */}
            <HStack justify="space-between" wrap="wrap" spacing={2}>
              <Text fontSize="sm" color="gray.600">
                {selectedOrphanIds.length} of {orphanedFiles.length} selected
              </Text>
              
              <ButtonGroup size="sm" spacing={2}>
                <Tooltip label="Move selected files to project root (coming soon)">
                  <Button
                    leftIcon={<FiMove />}
                    colorScheme="blue"
                    variant="outline"
                    isDisabled={selectedOrphanIds.length === 0 || !projectRoot}
                  >
                    Move to Root ({selectedOrphanIds.length})
                  </Button>
                </Tooltip>
                
                <Button
                  leftIcon={<FiTrash2 />}
                  colorScheme="red"
                  variant="outline"
                  isDisabled={selectedOrphanIds.length === 0}
                  onClick={handleDeleteSelected}
                >
                  Delete Selected ({selectedOrphanIds.length})
                </Button>
                
                <Button
                  leftIcon={<FiTool />}
                  colorScheme="orange"
                  onClick={handleRebuildProject}
                  isLoading={loading}
                >
                  Auto-Fix All
                </Button>
              </ButtonGroup>
            </HStack>

            <Alert status="info" size="sm">
              <AlertIcon />
              <Text fontSize="xs">
                <strong>Auto-Fix All</strong> will scan your project folder on disk and rebuild the database to match what's actually there.
              </Text>
            </Alert>
          </VStack>
        </Box>
      ) : (
        <Alert status="success">
          <AlertIcon />
          <Text fontSize="sm">✅ No orphaned files found in this project! All files are properly organized.</Text>
        </Alert>
      )}

      {/* Unassigned Orphaned Files Section */}
      {unassignedOrphanedFiles.length > 0 && (
        <Box border="1px solid" borderColor="pink.300" borderRadius="md" p={4} bg="pink.50" _dark={{ bg: "pink.900" }}>
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
              <HStack>
                <FiAlertTriangle color="darkred" />
                <Text fontWeight="bold" color="red.700">
                  Unassigned Orphaned Files ({unassignedOrphanedFiles.length})
                </Text>
              </HStack>
              <HStack spacing={2}>
                <Button size="xs" onClick={selectAllUnassigned}>Select All</Button>
                <Button size="xs" onClick={clearUnassignedSelection}>Clear</Button>
              </HStack>
            </HStack>

            <Text fontSize="sm" color="red.600">
              These files are orphaned and not attached to any project.
            </Text>

            <Box maxH="200px" overflowY="auto" border="1px solid" borderColor="gray.300" borderRadius="md">
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Select</Th>
                    <Th>Name</Th>
                    <Th>Type</Th>
                    <Th>ID</Th>
                    <Th>File Path</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {unassignedOrphanedFiles.map(file => (
                    <Tr key={file.id}>
                      <Td>
                        <Checkbox
                          isChecked={selectedUnassignedIds.includes(file.id)}
                          onChange={(e) => handleUnassignedSelection(file.id, e.target.checked)}
                        />
                      </Td>
                      <Td>
                        <HStack>
                          <Icon as={getFileIcon(file)} color={getFileIconColor(file)} />
                          <Text fontSize="sm">{file.name}</Text>
                        </HStack>
                      </Td>
                      <Td>
                        <Badge colorScheme={file.type === 'folder' ? 'yellow' : 'blue'}>
                          {file.type}
                        </Badge>
                      </Td>
                      <Td>
                        <Code fontSize="xs">{file.id.slice(0, 8)}...</Code>
                      </Td>
                      <Td>
                        <Text fontSize="xs" color="gray.600" maxW="150px" isTruncated>
                          {file.file_path || 'No path set'}
                        </Text>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>

            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600">
                {selectedUnassignedIds.length} of {unassignedOrphanedFiles.length} selected
              </Text>
              <Button
                size="sm"
                colorScheme="red"
                variant="outline"
                leftIcon={<FiTrash2 />}
                onClick={handleDeleteUnassigned}
                isDisabled={selectedUnassignedIds.length === 0}
                isLoading={loading}
              >
                Delete Selected ({selectedUnassignedIds.length})
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Delete Orphaned Files</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="stretch">
              <Alert status="warning">
                <AlertIcon />
                <Text>You are about to permanently delete {selectedOrphanIds.length} orphaned file(s).</Text>
              </Alert>
              
              <Text fontSize="sm">Selected files:</Text>
              <Box maxH="200px" overflowY="auto" border="1px solid" borderColor="gray.300" borderRadius="md" p={2}>
                {selectedOrphanIds.map(id => {
                  const file = orphanedFiles.find(f => f.id === id);
                  return file ? (
                    <HStack key={id} spacing={2}>
                      <Icon as={getFileIcon(file)} color={getFileIconColor(file)} />
                      <Text fontSize="sm">{file.name}</Text>
                    </HStack>
                  ) : null;
                })}
              </Box>
              
              <Text fontSize="sm" color="red.600">
                <strong>Warning:</strong> This action cannot be undone. The files will be deleted from disk as well.
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="red" 
              onClick={confirmDelete}
              isLoading={loading}
            >
              Delete Selected Files
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default OrphanDetector;