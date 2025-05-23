// src/components/Sidebar.jsx - Refactored with modular components
import React from 'react';
import { 
  Box, 
  VStack, 
  Text, 
  Button, 
  HStack,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiPlus } from 'react-icons/fi';
import { QuickProjectButton } from './ProjectTemplates';
import ProjectList from './sidebar/ProjectList';
import ProjectModals from './sidebar/ProjectModals';
import EmptyProjectsState from './sidebar/EmptyProjectsState';
import { useProjectActions } from './sidebar/hooks/useProjectActions';

const Sidebar = ({ 
  projects, 
  nodes, 
  clients,
  selectedNode,
  setSelectedNode,
  createProject, 
  createFolder, 
  createFile, 
  renameNode, 
  deleteNode,
  deleteProject,
  renameProject,
  moveProject,
  duplicateProject,
  moveNode,
  duplicateNode,
  setNodes
}) => {
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Personal projects color scheme (grey)
  const personalProjectColor = {
    name: 'Gray',
    value: 'gray.500',
    bg: 'gray.50',
    dark: 'gray.100',
    border: 'gray.300'
  };

  // Use custom hook for project actions
  const projectActions = useProjectActions({
    createProject,
    renameProject,
    moveProject,
    deleteProject,
    deleteNode,
    duplicateProject,
    clients,
  });

  // Group projects by client
  const projectsByClient = {};
  
  projectsByClient["none"] = projects.filter(p => 
    (!p.clientId && !p.client_id) || 
    (p.clientId === null && p.client_id === null)
  );
  
  clients.forEach(client => {
    projectsByClient[client.id] = projects.filter(p => 
      p.clientId === client.id || p.client_id === client.id
    );
  });

  return (
    <Box 
      w="280px" 
      borderRight="1px" 
      borderColor={borderColor} 
      h="100%" 
      overflowY="auto"
    >
      <VStack align="stretch" spacing={0}>
        {/* Enhanced Header with Quick Project Button */}
        <Flex 
          justify="space-between" 
          align="center" 
          p={4} 
          borderBottom="1px" 
          borderColor={borderColor}
          gap={2}
        >
          <Text fontWeight="bold">Projects</Text>
          <HStack spacing={2}>
            <Button 
              leftIcon={<FiPlus />} 
              size="sm" 
              colorScheme="blue"
              onClick={projectActions.onNewProjectOpen}
            >
              New
            </Button>
            <QuickProjectButton 
              onCreateProject={createProject} 
              clients={clients} 
            />
          </HStack>
        </Flex>
        
        {/* Project List or Empty State */}
        {projects.length === 0 ? (
          <EmptyProjectsState 
            createProject={createProject}
            clients={clients}
          />
        ) : (
          <ProjectList
            projectsByClient={projectsByClient}
            personalProjectColor={personalProjectColor}
            clients={clients}
            nodes={nodes}
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            createFolder={createFolder}
            createFile={createFile}
            renameNode={renameNode}
            confirmDeleteNode={projectActions.confirmDeleteNode}
            confirmDeleteProject={projectActions.confirmDeleteProject}
            startRenameProject={projectActions.startRenameProject}
            startMoveProject={projectActions.startMoveProject}
            handleDuplicateProject={projectActions.handleDuplicateProject}
            moveNode={moveNode}
            duplicateNode={duplicateNode}
            projects={projects}
            setNodes={setNodes}
          />
        )}
      </VStack>
      
      {/* All Modals */}
      <ProjectModals
        // New Project Modal
        isNewProjectOpen={projectActions.isNewProjectOpen}
        onNewProjectClose={projectActions.onNewProjectClose}
        newProjectName={projectActions.newProjectName}
        setNewProjectName={projectActions.setNewProjectName}
        selectedClient={projectActions.selectedClient}
        setSelectedClient={projectActions.setSelectedClient}
        clients={clients}
        handleCreateProject={projectActions.handleCreateProject}
        
        // Rename Project Modal
        isRenameProjectOpen={projectActions.isRenameProjectOpen}
        onRenameProjectClose={projectActions.onRenameProjectClose}
        projectToRename={projectActions.projectToRename}
        renameProjectName={projectActions.renameProjectName}
        setRenameProjectName={projectActions.setRenameProjectName}
        handleRenameProject={projectActions.handleRenameProject}
        
        // Move Project Modal
        isMoveProjectOpen={projectActions.isMoveProjectOpen}
        onMoveProjectClose={projectActions.onMoveProjectClose}
        projectToMove={projectActions.projectToMove}
        handleMoveProject={projectActions.handleMoveProject}
        personalProjectColor={personalProjectColor}
        
        // Delete Project Modal
        isDeleteProjectOpen={projectActions.isDeleteProjectOpen}
        onDeleteProjectClose={projectActions.onDeleteProjectClose}
        handleDeleteProject={projectActions.handleDeleteProject}
        
        // Delete Node Modal
        isDeleteNodeOpen={projectActions.isDeleteNodeOpen}
        onDeleteNodeClose={projectActions.onDeleteNodeClose}
        handleDeleteNode={projectActions.handleDeleteNode}
      />
    </Box>
  );
};

export default Sidebar;