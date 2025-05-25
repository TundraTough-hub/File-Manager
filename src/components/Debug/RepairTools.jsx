// src/components/Debug/RepairTools.jsx - Tools to fix project issues
import React from 'react';
import {
  VStack,
  HStack,
  Button,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  Box,
  Divider,
} from '@chakra-ui/react';
import { 
  FiTool, 
  FiRefreshCw,
  FiPlus,
  FiAlertTriangle,
} from 'react-icons/fi';

const RepairTools = ({ 
  currentProject,
  projectRoot,
  orphanedFiles = [],
  onRepairProjectRoot,
  onRebuildProject,
  onCreateMissingRoot,
  onForceRefresh, // Add this new prop
  loading = false,
}) => {
  
  const hasIssues = !projectRoot || orphanedFiles.length > 0;
  
  if (!currentProject) {
    return (
      <Box p={4} textAlign="center" color="gray.500">
        <Text>Select a project to see repair options</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* Project Status */}
      <Box>
        <Text fontWeight="bold" mb={2}>Project: {currentProject.name}</Text>
        <HStack wrap="wrap" spacing={2}>
          <Badge 
            colorScheme={projectRoot ? "green" : "red"}
            variant="solid"
          >
            Root: {projectRoot ? "✅ Found" : "❌ Missing"}
          </Badge>
          <Badge 
            colorScheme={orphanedFiles.length > 0 ? "orange" : "green"}
            variant="solid"
          >
            Orphans: {orphanedFiles.length}
          </Badge>
        </HStack>
      </Box>

      <Divider />

      {/* Issues and Repairs */}
      {!projectRoot && (
        <Alert status="error">
          <AlertIcon />
          <Box>
            <AlertTitle>Missing Project Root!</AlertTitle>
            <AlertDescription>
              This project is missing its hidden root folder. This prevents new files 
              from being properly synced and causes the file tree to malfunction.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {orphanedFiles.length > 0 && (
        <Alert status="warning">
          <AlertIcon />
          <Box>
            <AlertTitle>Orphaned Files Found!</AlertTitle>
            <AlertDescription>
              {orphanedFiles.length} file(s) have no parent folder and won't appear 
              in the file tree.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Repair Actions */}
      <VStack spacing={3} align="stretch">
        <Text fontWeight="medium">🔧 Repair Actions:</Text>
        
        {!projectRoot && (
          <Button
            leftIcon={<FiPlus />}
            colorScheme="red"
            variant="solid"
            onClick={() => onCreateMissingRoot?.(currentProject.id)}
            isLoading={loading}
            loadingText="Creating Root..."
          >
            Create Missing Project Root
          </Button>
        )}

        <Button
          leftIcon={<FiRefreshCw />}
          colorScheme="blue"
          variant="outline"
          onClick={() => onRebuildProject?.(currentProject.id)}
          isLoading={loading}
          loadingText="Rebuilding..."
        >
          Rebuild Project Tree
        </Button>

        <Button
          leftIcon={<FiRefreshCw />}
          colorScheme="purple"
          variant="outline"
          onClick={() => onForceRefresh?.(currentProject.id)}
          isLoading={loading}
          loadingText="Refreshing..."
        >
          Force Refresh UI
        </Button>

        {orphanedFiles.length > 0 && (
          <Button
            leftIcon={<FiTool />}
            colorScheme="orange"
            variant="outline"
            onClick={() => onRepairProjectRoot?.(currentProject.id)}
            isLoading={loading}
            loadingText="Repairing..."
          >
            Fix Orphaned Files ({orphanedFiles.length})
          </Button>
        )}
      </VStack>

      {/* Instructions */}
      <Box p={3} bg="blue.50" borderRadius="md" _dark={{ bg: "blue.900" }}>
        <Text fontSize="sm" fontWeight="medium" mb={2}>🔍 What these do:</Text>
        <VStack align="start" spacing={1} fontSize="xs">
          <Text><strong>Create Missing Root:</strong> Creates the hidden project root folder that all files need</Text>
          <Text><strong>Rebuild Project Tree:</strong> Scans disk and rebuilds the entire file structure</Text>
          <Text><strong>Force Refresh UI:</strong> Syncs the UI with the current backend state</Text>
          <Text><strong>Fix Orphaned Files:</strong> Moves orphaned files to the project root</Text>
        </VStack>
      </Box>

      {/* Success State */}
      {!hasIssues && (
        <Alert status="success">
          <AlertIcon />
          <AlertTitle>Project is healthy!</AlertTitle>
          <AlertDescription>
            No structural issues detected. File sync should work normally.
          </AlertDescription>
        </Alert>
      )}
    </VStack>
  );
};

export default RepairTools;