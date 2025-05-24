// src/components/DebugPanel.jsx - Debug information for file structure
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
} from '@chakra-ui/react';
import { 
  FiBug, 
  FiRefreshCw, 
  FiCopy,
  FiDatabase,
  FiFolder,
  FiFile,
  FiEye,
  FiTool,
} from 'react-icons/fi';
import { invoke } from '@tauri-apps/api/tauri';

const DebugPanel = ({ projects, nodes, clients, selectedNode, projectId }) => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const selectedNodeData = nodes.find(n => n.id === selectedNode);
  const currentProject = projects.find(p => p.id === projectId);

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

  const fixOrphanedFiles = async () => {
    if (!projectId) {
      toast({
        title: 'No project selected',
        description: 'Please select a project first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      
      // Use the rebuild command to fix the structure
      const result = await invoke('rebuild_project_tree', {
        projectId,
      });
      
      toast({
        title: 'Structure fixed',
        description: `Rebuilt with ${result.length} items`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Refresh the page or trigger a reload
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Failed to fix structure:', error);
      toast({
        title: 'Fix failed',
        description: error.toString(),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Find orphaned files (files with null parent_id that aren't hidden)
  const orphanedFiles = nodes.filter(node => 
    (node.project_id === projectId || node.projectId === projectId) &&
    (node.parent_id === null || node.parent_id === undefined) &&
    !node.hidden &&
    node.name !== '__PROJECT_ROOT__'
  );

  // Find the project root
  const projectRoot = nodes.find(node => 
    (node.project_id === projectId || node.projectId === projectId) &&
    (node.hidden === true || node.name === '__PROJECT_ROOT__')
  );

  return (
    <Box p={4} border="1px solid" borderColor="orange.200" borderRadius="md" bg="orange.50" _dark={{ bg: "orange.900", borderColor: "orange.700" }}>
      <VStack spacing={4} align="stretch">
        <HStack justify="space-between">
          <HStack>
            <FiBug />
            <Text fontWeight="bold" color="orange.700" _dark={{ color: "orange.300" }}>
              Debug Panel
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
            <Tooltip label="Fix file structure">
              <IconButton
                icon={<FiTool />}
                size="sm"
                onClick={fixOrphanedFiles}
                isLoading={loading}
                colorScheme="red"
                variant="outline"
                isDisabled={!projectId}
              />
            </Tooltip>
          </HStack>
        </HStack>

        {/* Quick Stats */}
        <HStack wrap="wrap" spacing={4}>
          <Badge colorScheme="blue">Projects: {projects.length}</Badge>
          <Badge colorScheme="green">Nodes: {nodes.length}</Badge>
          <Badge colorScheme="purple">Clients: {clients.length}</Badge>
          {orphanedFiles.length > 0 && (
            <Badge colorScheme="red">Orphaned: {orphanedFiles.length}</Badge>
          )}
        </HStack>

        {/* Current Selection Info */}
        {selectedNodeData && (
          <Alert status="info" size="sm">
            <AlertIcon />
            <VStack align="start" spacing={1} fontSize="xs">
              <Text><strong>Selected:</strong> {selectedNodeData.name}</Text>
              <Text><strong>Type:</strong> {selectedNodeData.type}</Text>
              <Text><strong>Parent ID:</strong> {selectedNodeData.parent_id || 'null'}</Text>
              <Text><strong>Project ID:</strong> {selectedNodeData.project_id || selectedNodeData.projectId}</Text>
              <Text><strong>File Path:</strong> {selectedNodeData.file_path || 'none'}</Text>
            </VStack>
          </Alert>
        )}

        {/* Orphaned Files Warning */}
        {orphanedFiles.length > 0 && (
          <Alert status="warning">
            <AlertIcon />
            <VStack align="start" spacing={2}>
              <Text fontWeight="medium">Found {orphanedFiles.length} orphaned file(s)!</Text>
              <Text fontSize="sm">
                These files have null parent_id and should be fixed:
              </Text>
              <VStack align="start" spacing={1} fontSize="xs">
                {orphanedFiles.slice(0, 5).map(file => (
                  <HStack key={file.id}>
                    <Icon as={file.type === 'folder' ? FiFolder : FiFile} />
                    <Text>{file.name}</Text>
                    <Code fontSize="xs">{file.id.slice(0, 8)}</Code>
                  </HStack>
                ))}
                {orphanedFiles.length > 5 && (
                  <Text color="gray.500">...and {orphanedFiles.length - 5} more</Text>
                )}
              </VStack>
              <Button
                size="sm"
                colorScheme="red"
                onClick={fixOrphanedFiles}
                isLoading={loading}
                leftIcon={<FiTool />}
              >
                Fix Structure
              </Button>
            </VStack>
          </Alert>
        )}

        {/* Project Root Info */}
        {projectRoot && (
          <Alert status="success" size="sm">
            <AlertIcon />
            <VStack align="start" spacing={1} fontSize="xs">
              <Text><strong>Project Root Found:</strong></Text>
              <Text>ID: {projectRoot.id}</Text>
              <Text>Name: {projectRoot.name}</Text>
              <Text>Hidden: {String(projectRoot.hidden)}</Text>
            </VStack>
          </Alert>
        )}

        {!projectRoot && projectId && (
          <Alert status="error">
            <AlertIcon />
            <Text fontSize="sm">No project root found for current project!</Text>
          </Alert>
        )}

        <Accordion allowToggle>
          {/* Project Structure */}
          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <HStack>
                  <FiEye />
                  <Text>Project Structure Analysis</Text>
                </HStack>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <VStack align="stretch" spacing={2} fontSize="xs">
                <Text fontWeight="medium">Current Project: {currentProject?.name || 'None'}</Text>
                
                {projectId && (
                  <>
                    <Divider />
                    <Text fontWeight="medium">Files in this project:</Text>
                    {nodes
                      .filter(n => (n.project_id === projectId || n.projectId === projectId))
                      .map(node => (
                        <HStack key={node.id} spacing={2}>
                          <Icon as={node.type === 'folder' ? FiFolder : FiFile} />
                          <Text flex="1">{node.name}</Text>
                          <Badge size="xs" colorScheme={node.parent_id ? "green" : "red"}>
                            {node.parent_id ? "Has Parent" : "Orphaned"}
                          </Badge>
                          <Code fontSize="xs">{node.id.slice(0, 8)}</Code>
                        </HStack>
                      ))
                    }
                  </>
                )}
              </VStack>
            </AccordionPanel>
          </AccordionItem>

          {/* Raw Data */}
          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <HStack>
                  <FiDatabase />
                  <Text>Raw Data Dump</Text>
                </HStack>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <VStack align="stretch" spacing={3}>
                <HStack>
                  <Text fontSize="sm" fontWeight="medium">Projects:</Text>
                  <IconButton
                    icon={<FiCopy />}
                    size="xs"
                    onClick={() => copyToClipboard(JSON.stringify(projects, null, 2))}
                  />
                </HStack>
                <Code fontSize="xs" overflowX="auto" maxH="150px" overflowY="auto">
                  {JSON.stringify(projects, null, 2)}
                </Code>

                <HStack>
                  <Text fontSize="sm" fontWeight="medium">Nodes (first 10):</Text>
                  <IconButton
                    icon={<FiCopy />}
                    size="xs"
                    onClick={() => copyToClipboard(JSON.stringify(nodes.slice(0, 10), null, 2))}
                  />
                </HStack>
                <Code fontSize="xs" overflowX="auto" maxH="200px" overflowY="auto">
                  {JSON.stringify(nodes.slice(0, 10), null, 2)}
                </Code>
              </VStack>
            </AccordionPanel>
          </AccordionItem>

          {/* App Info */}
          {debugInfo && (
            <AccordionItem>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  <HStack>
                    <FiDatabase />
                    <Text>App Information</Text>
                  </HStack>
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <VStack align="stretch" spacing={2} fontSize="xs">
                  <HStack>
                    <Text fontWeight="medium">App Data Dir:</Text>
                    <IconButton
                      icon={<FiCopy />}
                      size="xs"
                      onClick={() => copyToClipboard(debugInfo.app_data_dir)}
                    />
                  </HStack>
                  <Code>{debugInfo.app_data_dir}</Code>
                  
                  <HStack>
                    <Text fontWeight="medium">Files Dir:</Text>
                    <IconButton
                      icon={<FiCopy />}
                      size="xs"
                      onClick={() => copyToClipboard(debugInfo.files_dir)}
                    />
                  </HStack>
                  <Code>{debugInfo.files_dir}</Code>

                  <HStack spacing={4}>
                    <Badge colorScheme={debugInfo.app_data_exists ? "green" : "red"}>
                      App Data: {debugInfo.app_data_exists ? "EXISTS" : "MISSING"}
                    </Badge>
                    <Badge colorScheme={debugInfo.files_dir_exists ? "green" : "red"}>
                      Files Dir: {debugInfo.files_dir_exists ? "EXISTS" : "MISSING"}
                    </Badge>
                  </HStack>
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          )}
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
          {orphanedFiles.length > 0 && (
            <Button
              size="sm"
              leftIcon={<FiTool />}
              onClick={fixOrphanedFiles}
              isLoading={loading}
              colorScheme="red"
            >
              Fix All Issues
            </Button>
          )}
        </HStack>
      </VStack>
    </Box>
  );
};

export default DebugPanel;