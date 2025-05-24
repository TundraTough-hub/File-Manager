// src/components/FileTree/components/FileTreeMoveModal.jsx
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
  Text,
  Box,
  Icon,
} from '@chakra-ui/react';
import { FiFolder } from 'react-icons/fi';

const FileTreeMoveModal = ({
  isOpen,
  onClose,
  nodeToMove,
  getMoveDestinations,
  handleMoveToFolder,
}) => {
  if (!nodeToMove) return null;

  const destinations = getMoveDestinations();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Move "{nodeToMove.name}"</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={2} align="stretch" maxH="300px" overflowY="auto">
            <Text fontSize="sm" color="gray.600" mb={2}>
              Choose destination:
            </Text>
            
            {destinations.map((destination, index) => (
              <Button
                key={`${destination.projectId}-${destination.id}-${index}`}
                variant="outline"
                justifyContent="flex-start"
                onClick={() => handleMoveToFolder(destination.id, destination.projectId)}
                size="sm"
                leftIcon={
                  <Icon 
                    as={FiFolder} 
                    color={destination.isProjectRoot ? "blue.500" : "yellow.500"} 
                  />
                }
              >
                <Box textAlign="left" flex="1">
                  <Text fontSize="sm">{destination.name}</Text>
                  {destination.projectName !== 'Current Project' && (
                    <Text fontSize="xs" color="gray.500">
                      in {destination.projectName}
                    </Text>
                  )}
                </Box>
              </Button>
            ))}
            
            {destinations.length === 0 && (
              <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                No available destinations
              </Text>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default FileTreeMoveModal;