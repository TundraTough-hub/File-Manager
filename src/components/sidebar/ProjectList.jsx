// src/components/sidebar/ProjectList.jsx
// Accordion component that organizes projects by client

import React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  HStack,
  Text,
  Circle,
  Badge,
  Box,
} from '@chakra-ui/react';
import { FiUser, FiBriefcase } from 'react-icons/fi';
import ProjectItem from './ProjectItem';

const ProjectList = ({
  projectsByClient,
  personalProjectColor,
  clients,
  // Project operations
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
}) => {
  return (
    <Accordion defaultIndex={[0]} allowMultiple>
      {/* Personal Projects */}
      {projectsByClient["none"].length > 0 && (
        <AccordionItem border="0">
          <AccordionButton 
            py={3} 
            px={4}
            bg={personalProjectColor.bg}
            _dark={{ bg: personalProjectColor.dark }}
            borderLeft="4px solid"
            borderLeftColor={personalProjectColor.value}
            _hover={{ 
              bg: personalProjectColor.dark,
              _dark: { bg: 'gray.200' }
            }}
          >
            <HStack flex="1" textAlign="left">
              <Circle size="12px" bg={personalProjectColor.value} />
              <Box as={FiUser} color={personalProjectColor.value} />
              <Text fontWeight="semibold" color={personalProjectColor.value}>
                Personal Projects
              </Text>
              <Badge 
                size="sm" 
                colorScheme="gray"
                variant="solid"
              >
                {projectsByClient["none"].length}
              </Badge>
            </HStack>
            <AccordionIcon color={personalProjectColor.value} />
          </AccordionButton>
          <AccordionPanel p={0}>
            {projectsByClient["none"].map(project => (
              <ProjectItem
                key={project.id}
                project={project}
                nodes={nodes}
                selectedNode={selectedNode}
                setSelectedNode={setSelectedNode}
                createFolder={createFolder}
                createFile={createFile}
                renameNode={renameNode}
                confirmDeleteNode={confirmDeleteNode}
                confirmDeleteProject={confirmDeleteProject}
                startRenameProject={startRenameProject}
                startMoveProject={startMoveProject}
                handleDuplicateProject={handleDuplicateProject}
                moveNode={moveNode}
                duplicateNode={duplicateNode}
                projects={projects}
                setNodes={setNodes}
                clientColor={personalProjectColor}
              />
            ))}
          </AccordionPanel>
        </AccordionItem>
      )}
      
      {/* Client Projects */}
      {clients.map(client => {
        const clientProjects = projectsByClient[client.id] || [];
        if (clientProjects.length === 0) return null;
        
        const clientColor = client.color || {
          name: 'Blue',
          value: 'blue.500',
          bg: 'blue.50',
          dark: 'blue.100',
          border: 'blue.300'
        };
        
        return (
          <AccordionItem key={client.id} border="0">
            <AccordionButton 
              py={3} 
              px={4}
              bg={clientColor.bg}
              _dark={{ bg: clientColor.dark }}
              borderLeft="4px solid"
              borderLeftColor={clientColor.value}
              _hover={{ 
                bg: clientColor.dark,
                _dark: { bg: `${clientColor.value.split('.')[0]}.200` }
              }}
            >
              <HStack flex="1" textAlign="left">
                <Circle size="12px" bg={clientColor.value} />
                <Box as={FiBriefcase} color={clientColor.value} />
                <Text fontWeight="semibold" color={clientColor.value}>
                  {client.name}
                </Text>
                <Badge 
                  size="sm" 
                  colorScheme={clientColor.name.toLowerCase()}
                  variant="solid"
                >
                  {clientProjects.length}
                </Badge>
              </HStack>
              <AccordionIcon color={clientColor.value} />
            </AccordionButton>
            <AccordionPanel p={0}>
              {clientProjects.map(project => (
                <ProjectItem
                  key={project.id}
                  project={project}
                  nodes={nodes}
                  selectedNode={selectedNode}
                  setSelectedNode={setSelectedNode}
                  createFolder={createFolder}
                  createFile={createFile}
                  renameNode={renameNode}
                  confirmDeleteNode={confirmDeleteNode}
                  confirmDeleteProject={confirmDeleteProject}
                  startRenameProject={startRenameProject}
                  startMoveProject={startMoveProject}
                  handleDuplicateProject={handleDuplicateProject}
                  moveNode={moveNode}
                  duplicateNode={duplicateNode}
                  projects={projects}
                  setNodes={setNodes}
                  clientColor={clientColor}
                />
              ))}
            </AccordionPanel>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};

export default ProjectList;