// src/components/sidebar/hooks/useProjectActions.js
// Custom hook for project operation handlers

import { useState } from 'react';
import { useDisclosure, useToast } from '@chakra-ui/react';

export const useProjectActions = ({
  createProject,
  renameProject,
  moveProject,
  deleteProject,
  deleteNode,
  duplicateProject,
  clients,
}) => {
  // State for various operations
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [nodeToDelete, setNodeToDelete] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [projectToRename, setProjectToRename] = useState(null);
  const [renameProjectName, setRenameProjectName] = useState('');
  const [projectToMove, setProjectToMove] = useState(null);

  const toast = useToast();

  // Modal controls
  const { 
    isOpen: isNewProjectOpen, 
    onOpen: onNewProjectOpen, 
    onClose: onNewProjectClose 
  } = useDisclosure();
  
  const { 
    isOpen: isDeleteNodeOpen, 
    onOpen: onDeleteNodeOpen, 
    onClose: onDeleteNodeClose 
  } = useDisclosure();
  
  const { 
    isOpen: isDeleteProjectOpen, 
    onOpen: onDeleteProjectOpen, 
    onClose: onDeleteProjectClose 
  } = useDisclosure();
  
  const { 
    isOpen: isRenameProjectOpen, 
    onOpen: onRenameProjectOpen, 
    onClose: onRenameProjectClose 
  } = useDisclosure();
  
  const { 
    isOpen: isMoveProjectOpen, 
    onOpen: onMoveProjectOpen, 
    onClose: onMoveProjectClose 
  } = useDisclosure();

  // Action handlers
  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName.trim(), selectedClient);
      setNewProjectName('');
      setSelectedClient(null);
      onNewProjectClose();
    }
  };

  const handleDeleteNode = () => {
    if (nodeToDelete) {
      deleteNode(nodeToDelete);
      setNodeToDelete(null);
      onDeleteNodeClose();
    }
  };
  
  const handleDeleteProject = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete);
      setProjectToDelete(null);
      onDeleteProjectClose();
    }
  };

  const handleRenameProject = () => {
    if (!renameProjectName.trim()) {
      toast({
        title: 'Project name required',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    if (projectToRename && renameProject) {
      renameProject(projectToRename.id, renameProjectName.trim());
      setProjectToRename(null);
      setRenameProjectName('');
      onRenameProjectClose();
      
      toast({
        title: 'Project renamed',
        description: `Project renamed to "${renameProjectName.trim()}"`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleMoveProject = (targetClientId) => {
    if (projectToMove && moveProject) {
      const targetClientName = targetClientId 
        ? clients.find(c => c.id === targetClientId)?.name 
        : 'Personal Projects';
      
      moveProject(projectToMove.id, targetClientId);
      setProjectToMove(null);
      onMoveProjectClose();
      
      toast({
        title: 'Project moved',
        description: `Project moved to ${targetClientName}`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleDuplicateProject = async (project) => {
    try {
      await duplicateProject(project.id);
      toast({
        title: 'Project duplicated',
        description: `Created "${project.name} (Copy)"`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to duplicate project',
        description: error.toString(),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Starter functions
  const confirmDeleteNode = (nodeId) => {
    setNodeToDelete(nodeId);
    onDeleteNodeOpen();
  };
  
  const confirmDeleteProject = (projectId) => {
    setProjectToDelete(projectId);
    onDeleteProjectOpen();
  };
  
  const startRenameProject = (project) => {
    setProjectToRename(project);
    setRenameProjectName(project.name);
    onRenameProjectOpen();
  };
  
  const startMoveProject = (project) => {
    setProjectToMove(project);
    onMoveProjectOpen();
  };

  return {
    // State
    newProjectName,
    setNewProjectName,
    selectedClient,
    setSelectedClient,
    renameProjectName,
    setRenameProjectName,
    projectToRename,
    projectToMove,
    
    // Modal states
    isNewProjectOpen,
    onNewProjectOpen,
    onNewProjectClose,
    isDeleteNodeOpen,
    onDeleteNodeOpen,
    onDeleteNodeClose,
    isDeleteProjectOpen,
    onDeleteProjectOpen,
    onDeleteProjectClose,
    isRenameProjectOpen,
    onRenameProjectOpen,
    onRenameProjectClose,
    isMoveProjectOpen,
    onMoveProjectOpen,
    onMoveProjectClose,
    
    // Handlers
    handleCreateProject,
    handleDeleteNode,
    handleDeleteProject,
    handleRenameProject,
    handleMoveProject,
    handleDuplicateProject,
    
    // Starters
    confirmDeleteNode,
    confirmDeleteProject,
    startRenameProject,
    startMoveProject,
  };
};