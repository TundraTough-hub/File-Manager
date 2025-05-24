// src/components/DebugPanel.jsx - FIXED with correct parameter names
import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Code,
  Badge,
  Divider,
  useToast,
  Alert,
  AlertIcon,
  IconButton,
  Tooltip,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  ButtonGroup,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { 
  FiSettings,
  FiRefreshCw, 
  FiCopy,
  FiDatabase,
  FiFolder,
  FiFile,
  FiEye,
  FiTool,
  FiTrash2,
  FiMove,
  FiInfo,
  FiAlertTriangle,
} from 'react-icons/fi';
import { invoke } from '@tauri-apps/api/tauri';
import { appDir, join } from '@tauri-apps/api/path';


const DebugPanel = ({ projects, nodes, clients, selectedNode }) => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const [selectedOrphanIds, setSelectedOrphanIds] = useState([]);
  const { isOpen: isFixModalOpen, onOpen: onFixModalOpen, onClose: onFixModalClose } = useDisclosure();
  const toast = useToast();

  // Auto-select first project if none selected
  React.useEffect(() => {
    if (!selectedProjectId && projects.length === 1) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);


  const selectedNodeData = nodes.find(n => n.id === selectedNode);
  const currentProjectId = selectedProjectId || selectedNodeData?.project_id || selectedNodeData?.projectId || projects[0]?.id;
  const currentProject = projects.find(p => p.id === currentProjectId);

  const getAppInfo = async () => {
    try {
      setLoading(true);
      const appInfo = await invoke('get_app_info');
      setDebugInfo(appInfo);
      console.log('📊 Debug info loaded:', appInfo);
    } catch (error) {
      console.error('❌ Failed to get app info:', error);
      toast({
        title: 'Debug info failed',
        description: error.toString(),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied to clipboard',
        status: 'success',
        duration: 1000,
        isClosable: true,
      });
    });
  };

  const unassignedOrphanedFiles = nodes.filter(node =>
    (!node.project_id && !node.projectId) &&
    (node.parent_id === null || node.parent_id === undefined) &&
    !node.hidden &&
    node.name !== '__PROJECT_ROOT__'
  );

  const [selectedUnassignedIds, setSelectedUnassignedIds] = useState([]);

  const handleUnassignedSelection = (id, isChecked) => {
    if (isChecked) {
      setSelectedUnassignedIds(prev => [...prev, id]);
    } else {
      setSelectedUnassignedIds(prev => prev.filter(i => i !== id));
    }
  };

  const deleteUnassignedOrphans = async () => {
    if (selectedUnassignedIds.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select unassigned orphaned files to delete',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      for (const orphanId of selectedUnassignedIds) {
        const orphanFile = unassignedOrphanedFiles.find(f => f.id === orphanId);
        if (orphanFile) {
          const basePath = await appDir(); // This gives your app’s working folder
          const filePath = await join(basePath, orphanFile.file_path || orphanFile.name || '');

          await invoke('delete_node', {
            nodeId: orphanId,
            filePath,
            projectId: currentProjectId, // or null
          });

        }
      }

      toast({
        title: 'Files deleted',
        description: `${selectedUnassignedIds.length} unassigned orphaned files have been deleted`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setSelectedUnassignedIds([]);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Failed to delete unassigned orphans:', error);
      toast({
        title: 'Delete failed',
        description: error.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };


  // Find orphaned files for the current project
  const orphanedFiles = nodes.filter(node => 
    (node.project_id === currentProjectId || node.projectId === currentProjectId) &&
    (node.parent_id === null || node.parent_id === undefined) &&
    !node.hidden &&
    node.name !== '__PROJECT_ROOT__'
  );

  // Find orphaned files for all projects
  const allOrphanedFiles = nodes.filter(node => 
    (node.parent_id === null || node.parent_id === undefined) &&
    !node.hidden &&
    node.name !== '__PROJECT_ROOT__'
  );

  // Find the project root
  const projectRoot = nodes.find(node => 
    (node.project_id === currentProjectId || node.projectId === currentProjectId) &&
    (node.hidden === true || node.name === '__PROJECT_ROOT__')
  );

  const handleOrphanSelection = (orphanId, isChecked) => {
    if (isChecked) {
      setSelectedOrphanIds(prev => [...prev, orphanId]);
    } else {
      setSelectedOrphanIds(prev => prev.filter(id => id !== orphanId));
    }
  };

  const selectAllOrphans = () => {
    setSelectedOrphanIds(orphanedFiles.map(f => f.id));
  };

  const clearOrphanSelection = () => {
    setSelectedOrphanIds([]);
  };

  const moveOrphansToRoot = async () => {
    if (selectedOrphanIds.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select orphaned files to move',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!projectRoot) {
      toast({
        title: 'No project root found',
        description: 'Cannot move files - project root is missing',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // This would need a backend function to update parent_ids
    toast({
      title: 'Feature not implemented yet',
      description: 'Manual file moving will be implemented soon',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  const deleteSelectedOrphans = async () => {
    if (selectedOrphanIds.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select orphaned files to delete',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    onFixModalOpen();
  };

  // FIXED: Ensure correct parameter names for delete_node command
  const confirmDeleteOrphans = async () => {
    try {
      setLoading(true);
      
      for (const orphanId of selectedOrphanIds) {
        const orphanFile = orphanedFiles.find(f => f.id === orphanId);
        if (orphanFile) {
          console.log('🗑️ FIXED: Deleting orphan with correct params:', {
            nodeId: orphanId,
            filePath: orphanFile.file_path || orphanFile.name || '',
            projectId: currentProjectId,
          });
          
          // FIXED: Use correct camelCase parameter names that match the Rust command
          const basePath = await appDir(); // This gives your app’s working folder
          const filePath = await join(basePath, orphanFile.file_path || orphanFile.name || '');

          await invoke('delete_node', {
            nodeId: orphanId,
            filePath,
            projectId: currentProjectId, // or null
          });

        }
      }

      toast({
        title: 'Files deleted',
        description: `${selectedOrphanIds.length} orphaned files have been deleted`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      setSelectedOrphanIds([]);
      onFixModalClose();
      
      // Refresh after a moment
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('❌ FIXED: Failed to delete orphans:', error);
      toast({
        title: 'Delete failed',
        description: error.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fixAllOrphans = async () => {
    try {
      setLoading(true);
      
      // FIXED: Use correct camelCase parameter name
      const result = await invoke('rebuild_project_tree', {
        projectId: currentProjectId,  // snake_case project_id becomes camelCase projectId
      });
      
      toast({
        title: 'Project rebuilt',
        description: `Project structure rebuilt with ${result.length} items`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('❌ FIXED: Failed to rebuild project:', error);
      toast({
        title: 'Rebuild failed',
        description: error.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (node) => {
    if (node.type === 'folder') return FiFolder;
    return FiFile;
  };

  const getFileIconColor = (node) => {
    if (node.type === 'folder') return 'yellow.500';
    
    const ext = node.extension?.toLowerCase();
    if (ext === 'py') return 'blue.500';
    if (ext === 'json') return 'green.500';
    if (ext === 'csv') return 'green.600';
    if (ext === 'txt') return 'gray.600';
    if (ext === 'docx') return 'blue.600';
    
    return 'blue.500';
  };

  return (
    <Box p={4} border="1px solid" borderColor="orange.200" borderRadius="md" bg="orange.50" _dark={{ bg: "orange.900", borderColor: "orange.700" }}>
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <HStack>
            <FiSettings />
            <Text fontWeight="bold" color="orange.700" _dark={{ color: "orange.300" }}>
              Debug Panel - File Structure Analysis (FIXED)
            </Text>
          </HStack>
          <HStack>
            <Tooltip label="Get app info">
              <IconButton
                icon={<FiDatabase />}
                size="sm"
                onClick={getAppInfo}
                isLoading={loading}
                variant="outline"
              />
            </Tooltip>
          </HStack>
        </HStack>

        {/* Project Selection */}
        {projects.length > 1 && (
          <HStack>
            <Text fontSize="sm" fontWeight="medium">Current Project:</Text>
            <Select 
              size="sm" 
              value={selectedProjectId} 
              onChange={(e) => setSelectedProjectId(e.target.value)}
              maxW="250px"
            >
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </HStack>
        )}

        {/* Quick Stats */}
        <HStack wrap="wrap" spacing={4}>
          <Badge colorScheme="blue">Projects: {projects.length}</Badge>
          <Badge colorScheme="green">Total Nodes: {nodes.length}</Badge>
          <Badge colorScheme="purple">Clients: {clients.length}</Badge>
          {allOrphanedFiles.length > 0 && (
            <Badge colorScheme="red">Total Orphaned: {allOrphanedFiles.length}</Badge>
          )}
          {orphanedFiles.length > 0 && (
            <Badge colorScheme="orange">Current Project Orphaned: {orphanedFiles.length}</Badge>
          )}
        </HStack>

        {/* Current Project Info */}
        {currentProject && (
          <Alert status="info" size="sm">
            <AlertIcon />
            <VStack align="start" spacing={1} fontSize="sm">
              <Text><strong>Analyzing:</strong> {currentProject.name}</Text>
              <Text><strong>Project ID:</strong> <Code fontSize="xs">{currentProject.id}</Code></Text>
              <Text><strong>Root ID:</strong> <Code fontSize="xs">{currentProject.root_id || currentProject.rootId || 'Not set'}</Code></Text>
            </VStack>
          </Alert>
        )}

        {/* Project Root Status */}
        {projectRoot ? (
          <Alert status="success" size="sm">
            <AlertIcon />
            <Text fontSize="sm">✅ Project root found: <Code fontSize="xs">{projectRoot.id}</Code></Text>
          </Alert>
        ) : (
          <Alert status="error" size="sm">
            <AlertIcon />
            <Text fontSize="sm">❌ Project root missing - this will cause issues!</Text>
          </Alert>
        )}

        {/* FIXED Parameter Names Info */}
        <Alert status="info" size="sm">
          <AlertIcon />
          <Text fontSize="sm">
            <strong>FIXED:</strong> Updated to use correct camelCase parameter names for Tauri commands (nodeId, filePath, projectId)
          </Text>
        </Alert>

        {/* Orphaned Files Section */}
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
              <Box maxH="300px" overflowY="auto" border="1px solid" borderColor="gray.300" borderRadius="md">
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
                            <FiFile color={getFileIconColor(file)} />
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
                <HStack spacing={2}>
                  <Text fontSize="sm" color="gray.600">
                    {selectedOrphanIds.length} of {orphanedFiles.length} selected
                  </Text>
                </HStack>
                
                <ButtonGroup size="sm" spacing={2}>
                  <Tooltip label="Move selected files to project root (coming soon)">
                    <Button
                      leftIcon={<FiMove />}
                      colorScheme="blue"
                      variant="outline"
                      isDisabled={selectedOrphanIds.length === 0 || !projectRoot}
                      onClick={moveOrphansToRoot}
                    >
                      Move to Root ({selectedOrphanIds.length})
                    </Button>
                  </Tooltip>
                  
                  <Button
                    leftIcon={<FiTrash2 />}
                    colorScheme="red"
                    variant="outline"
                    isDisabled={selectedOrphanIds.length === 0}
                    onClick={deleteSelectedOrphans}
                  >
                    Delete Selected ({selectedOrphanIds.length})
                  </Button>
                  
                  <Button
                    leftIcon={<FiTool />}
                    colorScheme="orange"
                    onClick={fixAllOrphans}
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

        {unassignedOrphanedFiles.length > 0 && (
          <Box mt={6} border="1px solid" borderColor="pink.300" borderRadius="md" p={4} bg="pink.50" _dark={{ bg: "pink.900" }}>
            <VStack align="stretch" spacing={3}>
              <HStack justify="space-between">
                <HStack>
                  <FiAlertTriangle color="darkred" />
                  <Text fontWeight="bold" color="red.700">
                    Unassigned Orphaned Files ({unassignedOrphanedFiles.length})
                  </Text>
                </HStack>
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  leftIcon={<FiTrash2 />}
                  onClick={deleteUnassignedOrphans}
                  isDisabled={selectedUnassignedIds.length === 0}
                >
                  Delete Selected ({selectedUnassignedIds.length})
                </Button>
              </HStack>

              <Text fontSize="sm" color="red.600">
                These files are orphaned and not attached to any project.
              </Text>

              <Box maxH="300px" overflowY="auto" border="1px solid" borderColor="gray.300" borderRadius="md">
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
                            <FiFile color={getFileIconColor(file)} />
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
            </VStack>
          </Box>
        )}


        {/* Additional Debug Info */}
        <Accordion allowToggle>
          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <HStack>
                  <FiEye />
                  <Text>All Project Files ({nodes.filter(n => n.project_id === currentProjectId || n.projectId === currentProjectId).length})</Text>
                </HStack>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <Box maxH="300px" overflowY="auto">
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Name</Th>
                      <Th>Type</Th>
                      <Th>Parent ID</Th>
                      <Th>Hidden</Th>
                      <Th>ID</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {nodes
                      .filter(n => n.project_id === currentProjectId || n.projectId === currentProjectId)
                      .map(node => (
                        <Tr key={node.id}>
                          <Td>
                            <HStack>
                              <FiFile color={getFileIconColor(node)} />
                              <Text fontSize="sm">{node.name}</Text>
                            </HStack>
                          </Td>
                          <Td>
                            <Badge size="sm" colorScheme={node.type === 'folder' ? 'yellow' : 'blue'}>
                              {node.type}
                            </Badge>
                          </Td>
                          <Td>
                            <Code fontSize="xs" colorScheme={node.parent_id ? 'green' : 'red'}>
                              {node.parent_id ? node.parent_id.slice(0, 8) + '...' : 'NULL'}
                            </Code>
                          </Td>
                          <Td>
                            <Badge size="xs" colorScheme={node.hidden ? 'purple' : 'gray'}>
                              {node.hidden ? 'Yes' : 'No'}
                            </Badge>
                          </Td>
                          <Td>
                            <Code fontSize="xs">{node.id.slice(0, 8)}...</Code>
                          </Td>
                        </Tr>
                      ))
                    }
                  </Tbody>
                </Table>
              </Box>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        {/* Quick Actions */}
        <HStack wrap="wrap" spacing={2}>
          <Button
            size="sm"
            leftIcon={<FiRefreshCw />}
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Reload App
          </Button>
          <Button
            size="sm"
            leftIcon={<FiDatabase />}
            onClick={getAppInfo}
            isLoading={loading}
            variant="outline"
          >
            Get App Info
          </Button>
          <Button
            size="sm"
            leftIcon={<FiInfo />}
            onClick={() => copyToClipboard(JSON.stringify({ projects, nodes: nodes.slice(0, 5), clients }, null, 2))}
            variant="outline"
          >
            Copy Debug Data
          </Button>
        </HStack>
      </VStack>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isFixModalOpen} onClose={onFixModalClose}>
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
                      <FiFile />
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
            <Button variant="ghost" mr={3} onClick={onFixModalClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="red" 
              onClick={confirmDeleteOrphans}
              isLoading={loading}
            >
              Delete Selected Files
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default DebugPanel;