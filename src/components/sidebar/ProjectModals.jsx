// src/components/sidebar/ProjectModals.jsx
// All modal dialogs for project operations

import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Input,
  VStack,
  HStack,
  Select,
  Text,
  Circle,
  useColorModeValue,
} from '@chakra-ui/react';

const ProjectModals = ({
  // New Project Modal
  isNewProjectOpen,
  onNewProjectClose,
  newProjectName,
  setNewProjectName,
  selectedClient,
  setSelectedClient,
  clients,
  handleCreateProject,
  
  // Rename Project Modal
  isRenameProjectOpen,
  onRenameProjectClose,
  projectToRename,
  renameProjectName,
  setRenameProjectName,
  handleRenameProject,
  
  // Move Project Modal
  isMoveProjectOpen,
  onMoveProjectClose,
  projectToMove,
  handleMoveProject,
  personalProjectColor,
  
  // Delete Project Modal
  isDeleteProjectOpen,
  onDeleteProjectClose,
  handleDeleteProject,
  
  // Delete Node Modal
  isDeleteNodeOpen,
  onDeleteNodeClose,
  handleDeleteNode,
}) => {
  return (
    <>
      {/* New Project Modal */}
      <Modal isOpen={isNewProjectOpen} onClose={onNewProjectClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Project</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Input
                placeholder="Project Name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newProjectName.trim()) {
                    handleCreateProject();
                  }
                }}
                autoFocus
              />
              
              <Select
                placeholder="Select Client (Optional)"
                value={selectedClient || ""}
                onChange={(e) => setSelectedClient(e.target.value || null)}
              >
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onNewProjectClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleCreateProject}
              isDisabled={!newProjectName.trim()}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Rename Project Modal */}
      <Modal isOpen={isRenameProjectOpen} onClose={onRenameProjectClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Rename Project</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Project Name"
              value={renameProjectName}
              onChange={(e) => setRenameProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && renameProjectName.trim()) {
                  handleRenameProject();
                }
              }}
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRenameProjectClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleRenameProject}
              isDisabled={!renameProjectName.trim()}
            >
              Rename
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Move Project Modal */}
      <Modal isOpen={isMoveProjectOpen} onClose={onMoveProjectClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Move Project</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Move "{projectToMove?.name}" to:
              </Text>
              
              <Button
                variant="outline"
                justifyContent="flex-start"
                leftIcon={<Circle size="8px" bg={personalProjectColor.value} />}
                onClick={() => handleMoveProject(null)}
                isDisabled={!projectToMove?.client_id && !projectToMove?.clientId}
              >
                📁 Personal Projects
              </Button>
              
              {clients.map(client => (
                <Button
                  key={client.id}
                  variant="outline"
                  justifyContent="flex-start"
                  leftIcon={<Circle size="8px" bg={client.color?.value || 'blue.500'} />}
                  onClick={() => handleMoveProject(client.id)}
                  isDisabled={
                    (projectToMove?.client_id === client.id) || 
                    (projectToMove?.clientId === client.id)
                  }
                >
                  {client.name}
                </Button>
              ))}
              
              {clients.length === 0 && (
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  No clients available. Create a client first to move projects there.
                </Text>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onMoveProjectClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Project Modal */}
      <Modal isOpen={isDeleteProjectOpen} onClose={onDeleteProjectClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Project</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to delete this entire project? 
            This will delete all files and folders in the project and cannot be undone.
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteProjectClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDeleteProject}>
              Delete Project
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Node Modal */}
      <Modal isOpen={isDeleteNodeOpen} onClose={onDeleteNodeClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Delete</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to delete this item? 
            This will delete all child items and cannot be undone.
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteNodeClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDeleteNode}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ProjectModals;