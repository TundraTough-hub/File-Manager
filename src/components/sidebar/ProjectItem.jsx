// src/components/sidebar/ProjectItem.jsx
// Individual project component with file tree and actions

import React from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Circle,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import { 
  FiMoreVertical,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiBriefcase,
  FiFile,
  FiFolder,
} from 'react-icons/fi';
import EnhancedFileTree from '../EnhancedFileTree'; // Fixed: Go up one level to components folder
import FileTemplates from '../FileTemplates'; // Fixed: Go up one level to components folder

const ProjectItem = ({
  project,
  nodes,
  selectedNode,
  setSelectedNode,
  createFolder,
  createFile,
  renameNode,
  confirmDeleteNode,
  confirmDeleteProject,
  startRenameProject,
  startMoveProject,
  handleDuplicateProject,
  moveNode,
  duplicateNode,
  projects,
  setNodes,
  clientColor,
}) => {
  const rootNodeId = project.rootId || project.root_id;
  const rootNode = nodes.find(node => node.id === rootNodeId);
  
  if (!rootNode) return null;
  
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const visibleChildren = nodes.filter(node => 
    (node.project_id === project.id || node.projectId === project.id) &&
    !node.hidden &&
    node.name !== '__PROJECT_ROOT__'
  );
  
  const hasVisibleContent = visibleChildren.length > 0;
  
  const handleCreateFolder = async () => {
    await createFolder(rootNodeId, 'New Folder', project.id, true);
  };
  
  const handleCreateFile = async () => {
    await createFile(rootNodeId, 'New File.txt', project.id, true);
  };
  
  return (
    <Box 
      borderBottom="1px" 
      borderColor={borderColor}
      borderLeft="3px solid"
      borderLeftColor={clientColor?.value || 'gray.300'}
    >
      {/* Project Header */}
      <Flex 
        justify="space-between" 
        align="center" 
        px={4} 
        py={2} 
        bg={clientColor?.bg || 'gray.50'}
        _dark={{ bg: clientColor?.dark || 'gray.700' }}
        _hover={{
          bg: clientColor?.dark || 'gray.100',
          _dark: { bg: `${clientColor?.value?.split('.')[0] || 'gray'}.200` }
        }}
      >
        <HStack>
          <Circle size="8px" bg={clientColor?.value || 'gray.500'} />
          <Text fontWeight="medium" color={clientColor?.value || 'gray.700'}>
            {project.name}
          </Text>
        </HStack>
        
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<FiMoreVertical />}
            variant="ghost"
            size="xs"
            color={clientColor?.value || 'gray.500'}
          />
          <MenuList>
            {/* Add FileTemplates at the top */}
            <Box px={2} py={1}>
              <FileTemplates 
                onCreateFile={createFile}
                currentFolderId={rootNodeId}
                projectId={project.id}
                isDisabled={false}
              />
            </Box>
            <MenuDivider />
            
            {/* Existing menu items */}
            <MenuItem 
              icon={<FiPlus />}
              onClick={handleCreateFolder}
            >
              New Folder
            </MenuItem>
            <MenuItem 
              icon={<FiPlus />}
              onClick={handleCreateFile}
            >
              New File
            </MenuItem>
            <MenuItem 
              icon={<FiEdit />}
              onClick={() => startRenameProject(project)}
            >
              Rename Project
            </MenuItem>
            <MenuItem 
              icon={<FiBriefcase />}
              onClick={() => startMoveProject(project)}
            >
              Move to Client
            </MenuItem>
            <MenuItem 
              icon={<FiFile />}
              onClick={() => handleDuplicateProject(project)}
            >
              Duplicate Project
            </MenuItem>
            <MenuItem 
              icon={<FiTrash2 />}
              color="red.500"
              onClick={() => confirmDeleteProject(project.id)}
            >
              Delete Project
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
      
      {/* Project Content */}
      {hasVisibleContent ? (
        <Box pl={2}>
          <EnhancedFileTree
            nodes={nodes}
            rootId={rootNodeId}
            projectId={project.id}
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            createFolder={createFolder}
            createFile={createFile}
            renameNode={renameNode}
            confirmDelete={confirmDeleteNode}
            moveNode={moveNode}
            duplicateNode={duplicateNode}
            projects={projects}
            setNodes={setNodes}
          />
        </Box>
      ) : (
        <Box 
          p={4} 
          bg={clientColor?.bg || 'gray.25'} 
          _dark={{ bg: clientColor?.dark || 'gray.750' }}
        >
          <VStack spacing={3}>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              This project is empty. Quick start:
            </Text>
            <VStack spacing={2} w="100%">
              <FileTemplates 
                onCreateFile={createFile}
                currentFolderId={rootNodeId}
                projectId={project.id}
                isDisabled={false}
              />
              <HStack spacing={2}>
                <Button 
                  leftIcon={<FiFolder />} 
                  size="sm" 
                  variant="outline"
                  colorScheme={clientColor?.name?.toLowerCase() || 'gray'}
                  onClick={handleCreateFolder}
                >
                  Add Folder
                </Button>
                <Button 
                  leftIcon={<FiFile />} 
                  size="sm" 
                  variant="outline"
                  colorScheme={clientColor?.name?.toLowerCase() || 'gray'}
                  onClick={handleCreateFile}
                >
                  Add File
                </Button>
              </HStack>
            </VStack>
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default ProjectItem;