// src/components/Debug/ProjectAnalyzer.jsx
// Component for analyzing project structure and displaying project-specific debug info

import React from 'react';
import {
  VStack,
  HStack,
  Text,
  Select,
  Alert,
  AlertIcon,
  Code,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Icon,
} from '@chakra-ui/react';
import { 
  FiFolder,
  FiFile,
  FiInfo,
  FiAlertTriangle,
} from 'react-icons/fi';

const ProjectAnalyzer = ({ 
  projects, 
  nodes, 
  selectedProjectId,
  onProjectSelect,
  currentProject,
  projectRoot,
  orphanedFiles,
  getFileIcon,
  getFileIconColor,
}) => {
  // Auto-select first project if none selected
  React.useEffect(() => {
    if (!selectedProjectId && projects.length === 1) {
      onProjectSelect(projects[0].id);
    }
  }, [projects, selectedProjectId, onProjectSelect]);

  // Get all project files for analysis
  const getProjectFiles = (projectId) => {
    return nodes.filter(n => 
      (n.project_id === projectId || n.projectId === projectId) &&
      !n.hidden &&
      n.name !== '__PROJECT_ROOT__'
    );
  };

  const currentProjectFiles = currentProject ? getProjectFiles(currentProject.id) : [];

  return (
    <VStack spacing={4} align="stretch">
      {/* Project Selection */}
      {projects.length > 1 && (
        <HStack>
          <Text fontSize="sm" fontWeight="medium">Current Project:</Text>
          <Select 
            size="sm" 
            value={selectedProjectId || ''} 
            onChange={(e) => onProjectSelect(e.target.value)}
            maxW="250px"
          >
            <option value="">Select a project...</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </HStack>
      )}

      {/* Current Project Info */}
      {currentProject ? (
        <Alert status="info" size="sm">
          <AlertIcon />
          <VStack align="start" spacing={1} fontSize="sm">
            <Text><strong>Analyzing:</strong> {currentProject.name}</Text>
            <Text><strong>Project ID:</strong> <Code fontSize="xs">{currentProject.id}</Code></Text>
            <Text><strong>Root ID:</strong> <Code fontSize="xs">{currentProject.root_id || currentProject.rootId || 'Not set'}</Code></Text>
          </VStack>
        </Alert>
      ) : (
        <Alert status="warning" size="sm">
          <AlertIcon />
          <Text fontSize="sm">No project selected for analysis</Text>
        </Alert>
      )}

      {/* Project Root Status */}
      {currentProject && (
        projectRoot ? (
          <Alert status="success" size="sm">
            <AlertIcon />
            <Text fontSize="sm">✅ Project root found: <Code fontSize="xs">{projectRoot.id}</Code></Text>
          </Alert>
        ) : (
          <Alert status="error" size="sm">
            <AlertIcon />
            <Text fontSize="sm">❌ Project root missing - this will cause issues!</Text>
          </Alert>
        )
      )}

      {/* Project Statistics */}
      {currentProject && (
        <Box p={3} bg="blue.50" borderRadius="md" _dark={{ bg: "blue.900" }}>
          <Text fontSize="sm" fontWeight="medium" mb={2}>Project Statistics</Text>
          <VStack spacing={1} align="stretch" fontSize="xs">
            <HStack justify="space-between">
              <Text>Total Items:</Text>
              <Text fontWeight="medium">{currentProjectFiles.length}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text>Files:</Text>
              <Text fontWeight="medium">{currentProjectFiles.filter(n => n.type === 'file').length}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text>Folders:</Text>
              <Text fontWeight="medium">{currentProjectFiles.filter(n => n.type === 'folder').length}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text>Python Files:</Text>
              <Text fontWeight="medium">{currentProjectFiles.filter(n => n.extension === 'py').length}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text>Jupyter Notebooks:</Text>
              <Text fontWeight="medium">{currentProjectFiles.filter(n => n.extension === 'ipynb').length}</Text>
            </HStack>
            {orphanedFiles.length > 0 && (
              <HStack justify="space-between">
                <Text color="red.500">Orphaned Items:</Text>
                <Text fontWeight="medium" color="red.500">{orphanedFiles.length}</Text>
              </HStack>
            )}
          </VStack>
        </Box>
      )}

      {/* Project Structure Analysis */}
      {currentProject && (
        <Accordion allowToggle>
          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <HStack>
                  <FiInfo />
                  <Text>Project Structure ({currentProjectFiles.length} items)</Text>
                </HStack>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              {currentProjectFiles.length > 0 ? (
                <Box maxH="300px" overflowY="auto">
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Name</Th>
                        <Th>Type</Th>
                        <Th>Parent ID</Th>
                        <Th>Path</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {currentProjectFiles
                        .sort((a, b) => {
                          // Sort folders first, then files
                          if (a.type === 'folder' && b.type !== 'folder') return -1;
                          if (a.type !== 'folder' && b.type === 'folder') return 1;
                          return a.name.localeCompare(b.name);
                        })
                        .map(node => (
                          <Tr key={node.id}>
                            <Td>
                              <HStack spacing={2}>
                                <Icon as={getFileIcon(node)} color={getFileIconColor(node)} />
                                <Text fontSize="sm">{node.name}</Text>
                              </HStack>
                            </Td>
                            <Td>
                              <Badge 
                                size="sm" 
                                colorScheme={node.type === 'folder' ? 'yellow' : 'blue'}
                              >
                                {node.type}
                              </Badge>
                            </Td>
                            <Td>
                              <Code 
                                fontSize="xs" 
                                colorScheme={node.parent_id ? 'green' : 'red'}
                              >
                                {node.parent_id ? node.parent_id.slice(0, 8) + '...' : 'NULL'}
                              </Code>
                            </Td>
                            <Td>
                              <Text fontSize="xs" color="gray.600" maxW="200px" isTruncated>
                                {node.file_path || 'No path set'}
                              </Text>
                            </Td>
                          </Tr>
                        ))
                      }
                    </Tbody>
                  </Table>
                </Box>
              ) : (
                <Alert status="info" size="sm">
                  <AlertIcon />
                  <Text fontSize="sm">No files or folders in this project</Text>
                </Alert>
              )}
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      )}

      {/* Health Check Summary */}
      {currentProject && (
        <Box p={3} borderRadius="md" borderWidth="1px" borderColor="gray.300">
          <Text fontSize="sm" fontWeight="medium" mb={2}>Health Check</Text>
          <VStack spacing={2} align="stretch">
            <HStack justify="space-between">
              <Text fontSize="xs">Project Root:</Text>
              <Badge colorScheme={projectRoot ? "green" : "red"} size="sm">
                {projectRoot ? "Found" : "Missing"}
              </Badge>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="xs">Orphaned Files:</Text>
              <Badge 
                colorScheme={orphanedFiles.length === 0 ? "green" : "orange"} 
                size="sm"
              >
                {orphanedFiles.length === 0 ? "None" : orphanedFiles.length}
              </Badge>
            </HStack>
            <HStack justify="space-between">
              <Text fontSize="xs">File Structure:</Text>
              <Badge 
                colorScheme={currentProjectFiles.length > 0 ? "green" : "gray"} 
                size="sm"
              >
                {currentProjectFiles.length > 0 ? "Has Content" : "Empty"}
              </Badge>
            </HStack>
          </VStack>
        </Box>
      )}

      {/* No Project Selected */}
      {projects.length === 0 && (
        <Alert status="warning">
          <AlertIcon />
          <Text fontSize="sm">No projects found. Create a project to analyze its structure.</Text>
        </Alert>
      )}
    </VStack>
  );
};

export default ProjectAnalyzer;