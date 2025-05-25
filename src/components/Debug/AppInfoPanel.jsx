// src/components/Debug/AppInfoPanel.jsx
// Component for displaying application information and general debug stats

import React from 'react';
import {
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Alert,
  AlertIcon,
  Code,
  IconButton,
  Tooltip,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
} from '@chakra-ui/react';
import { 
  FiDatabase,
  FiRefreshCw,
  FiCopy,
  FiInfo,
} from 'react-icons/fi';

const AppInfoPanel = ({ 
  projects, 
  nodes, 
  clients, 
  debugInfo,
  loading,
  onGetAppInfo,
  onCopyToClipboard,
  onReloadApp,
  allOrphanedFiles,
}) => {
  const handleCopyDebugData = () => {
    const debugData = {
      projects: projects.slice(0, 3), // Limit for clipboard
      nodes: nodes.slice(0, 5),
      clients,
      appInfo: debugInfo,
      stats: {
        projectCount: projects.length,
        nodeCount: nodes.length,
        clientCount: clients.length,
        orphanCount: allOrphanedFiles.length,
      }
    };
    
    onCopyToClipboard(JSON.stringify(debugData, null, 2));
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Quick Stats */}
      <HStack wrap="wrap" spacing={4}>
        <Badge colorScheme="blue">Projects: {projects.length}</Badge>
        <Badge colorScheme="green">Total Nodes: {nodes.length}</Badge>
        <Badge colorScheme="purple">Clients: {clients.length}</Badge>
        {allOrphanedFiles.length > 0 && (
          <Badge colorScheme="red">Total Orphaned: {allOrphanedFiles.length}</Badge>
        )}
      </HStack>

      {/* Action Buttons */}
      <HStack wrap="wrap" spacing={2}>
        <Button
          size="sm"
          leftIcon={<FiRefreshCw />}
          onClick={onReloadApp}
          variant="outline"
        >
          Reload App
        </Button>
        <Button
          size="sm"
          leftIcon={<FiDatabase />}
          onClick={onGetAppInfo}
          isLoading={loading}
          variant="outline"
        >
          Get App Info
        </Button>
        <Button
          size="sm"
          leftIcon={<FiInfo />}
          onClick={handleCopyDebugData}
          variant="outline"
        >
          Copy Debug Data
        </Button>
      </HStack>

      {/* App Information */}
      {debugInfo && (
        <Accordion allowToggle>
          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <HStack>
                  <FiDatabase />
                  <Text>Application Information</Text>
                </HStack>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm" fontWeight="medium">App Data Directory:</Text>
                  <HStack>
                    <Code fontSize="xs" maxW="300px" isTruncated>
                      {debugInfo.app_data_dir}
                    </Code>
                    <Tooltip label="Copy path">
                      <IconButton
                        icon={<FiCopy />}
                        size="xs"
                        variant="ghost"
                        onClick={() => onCopyToClipboard(debugInfo.app_data_dir)}
                      />
                    </Tooltip>
                  </HStack>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" fontWeight="medium">Files Directory:</Text>
                  <HStack>
                    <Code fontSize="xs" maxW="300px" isTruncated>
                      {debugInfo.files_dir}
                    </Code>
                    <Tooltip label="Copy path">
                      <IconButton
                        icon={<FiCopy />}
                        size="xs"
                        variant="ghost"
                        onClick={() => onCopyToClipboard(debugInfo.files_dir)}
                      />
                    </Tooltip>
                  </HStack>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" fontWeight="medium">App Data Exists:</Text>
                  <Badge colorScheme={debugInfo.app_data_exists ? "green" : "red"}>
                    {debugInfo.app_data_exists ? "Yes" : "No"}
                  </Badge>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" fontWeight="medium">Files Dir Exists:</Text>
                  <Badge colorScheme={debugInfo.files_dir_exists ? "green" : "red"}>
                    {debugInfo.files_dir_exists ? "Yes" : "No"}
                  </Badge>
                </HStack>
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      )}

      {/* System Status */}
      <Alert status="info" size="sm">
        <AlertIcon />
        <VStack align="start" spacing={1} fontSize="sm">
          <Text>
            <strong>System Status:</strong> Debug panel active with fixed parameter names
          </Text>
          <Text fontSize="xs" color="gray.600">
            Using corrected camelCase parameter names for Tauri commands (nodeId, filePath, projectId)
          </Text>
        </VStack>
      </Alert>

      {/* Data Summary */}
      <Box p={3} bg="gray.50" borderRadius="md" _dark={{ bg: "gray.800" }}>
        <Text fontSize="sm" fontWeight="medium" mb={2}>Data Summary</Text>
        <VStack spacing={1} align="stretch" fontSize="xs">
          <HStack justify="space-between">
            <Text>Total Projects:</Text>
            <Text fontWeight="medium">{projects.length}</Text>
          </HStack>
          <HStack justify="space-between">
            <Text>Total Files & Folders:</Text>
            <Text fontWeight="medium">{nodes.length}</Text>
          </HStack>
          <HStack justify="space-between">
            <Text>Files:</Text>
            <Text fontWeight="medium">{nodes.filter(n => n.type === 'file').length}</Text>
          </HStack>
          <HStack justify="space-between">
            <Text>Folders:</Text>
            <Text fontWeight="medium">{nodes.filter(n => n.type === 'folder').length}</Text>
          </HStack>
          <HStack justify="space-between">
            <Text>Clients:</Text>
            <Text fontWeight="medium">{clients.length}</Text>
          </HStack>
          {allOrphanedFiles.length > 0 && (
            <HStack justify="space-between">
              <Text color="red.500">Orphaned Items:</Text>
              <Text fontWeight="medium" color="red.500">{allOrphanedFiles.length}</Text>
            </HStack>
          )}
        </VStack>
      </Box>
    </VStack>
  );
};

export default AppInfoPanel;