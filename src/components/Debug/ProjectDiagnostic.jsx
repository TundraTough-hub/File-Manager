// src/components/Debug/ProjectDiagnostic.jsx - Diagnostic and fix tool
import React, { useState } from 'react';
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
  Code,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { 
  FiTool, 
  FiRefreshCw,
  FiEye,
  FiAlertTriangle,
  FiCheck,
  FiX,
} from 'react-icons/fi';

const ProjectDiagnostic = ({ 
  currentProject,
  nodes = [],
  onForceRebuild,
  loading = false,
}) => {
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  
  if (!currentProject) {
    return (
      <Box p={4} textAlign="center" color="gray.500">
        <Text>Select a project to run diagnostics</Text>
      </Box>
    );
  }

  const projectId = currentProject.id;
  const projectNodes = nodes.filter(n => 
    n.project_id === projectId || n.projectId === projectId
  );
  
  const hiddenRoot = projectNodes.find(n => n.hidden || n.name === '__PROJECT_ROOT__');
  const visibleNodes = projectNodes.filter(n => !n.hidden && n.name !== '__PROJECT_ROOT__');
  const orphanedNodes = visibleNodes.filter(n => !n.parent_id && !n.parentId);
  const properlyConnectedNodes = visibleNodes.filter(n => n.parent_id || n.parentId);

  const runDiagnostic = () => {
    const result = {
      projectId,
      projectName: currentProject.name,
      totalNodes: projectNodes.length,
      hiddenRoot: hiddenRoot ? 'Found' : 'Missing',
      hiddenRootId: hiddenRoot?.id || 'None',
      visibleNodes: visibleNodes.length,
      orphanedNodes: orphanedNodes.length,
      properlyConnected: properlyConnectedNodes.length,
      issues: [],
      recommendations: [],
    };

    // Check for issues
    if (!hiddenRoot) {
      result.issues.push('Missing hidden project root');
      result.recommendations.push('Create missing project root');
    }

    if (orphanedNodes.length > 0) {
      result.issues.push(`${orphanedNodes.length} orphaned files/folders`);
      result.recommendations.push('Connect orphaned files to project root');
    }

    if (visibleNodes.length === 0 && hiddenRoot) {
      result.issues.push('Project root exists but has no children');
      result.recommendations.push('Rebuild project tree from disk');
    }

    if (result.issues.length === 0) {
      result.recommendations.push('Project structure looks healthy');
    }

    setDiagnosticResult(result);
  };

  const getStatusColor = (condition) => condition ? 'green' : 'red';
  const getStatusIcon = (condition) => condition ? FiCheck : FiX;

  return (
    <VStack spacing={4} align="stretch">
      {/* Project Info */}
      <Box>
        <Text fontWeight="bold" mb={2}>Project: {currentProject.name}</Text>
        <Text fontSize="sm" color="gray.600">ID: <Code>{projectId}</Code></Text>
      </Box>

      {/* Quick Stats */}
      <HStack wrap="wrap" spacing={2}>
        <Badge colorScheme="blue" variant="outline">
          {projectNodes.length} Total Nodes
        </Badge>
        <Badge colorScheme={hiddenRoot ? "green" : "red"} variant="solid">
          Root: {hiddenRoot ? "✅" : "❌"}
        </Badge>
        <Badge colorScheme={visibleNodes.length > 0 ? "green" : "orange"} variant="outline">
          {visibleNodes.length} Visible Files
        </Badge>
        {orphanedNodes.length > 0 && (
          <Badge colorScheme="red" variant="solid">
            {orphanedNodes.length} Orphaned
          </Badge>
        )}
      </HStack>

      <Divider />

      {/* Diagnostic Button */}
      <Button
        leftIcon={<FiEye />}
        colorScheme="blue"
        onClick={runDiagnostic}
        isLoading={loading}
      >
        Run Full Diagnostic
      </Button>

      {/* Diagnostic Results */}
      {diagnosticResult && (
        <Box p={4} bg="gray.50" borderRadius="md" _dark={{ bg: "gray.800" }}>
          <Text fontWeight="bold" mb={3}>📊 Diagnostic Results</Text>
          
          <VStack align="start" spacing={2}>
            <HStack>
              <Badge colorScheme={getStatusColor(diagnosticResult.hiddenRoot === 'Found')}>
                Hidden Root: {diagnosticResult.hiddenRoot}
              </Badge>
              {diagnosticResult.hiddenRootId !== 'None' && (
                <Text fontSize="xs" color="gray.500">
                  ID: {diagnosticResult.hiddenRootId}
                </Text>
              )}
            </HStack>

            <HStack>
              <Badge colorScheme={getStatusColor(diagnosticResult.visibleNodes > 0)}>
                Visible Nodes: {diagnosticResult.visibleNodes}
              </Badge>
            </HStack>

            <HStack>
              <Badge colorScheme={getStatusColor(diagnosticResult.orphanedNodes === 0)}>
                Orphaned: {diagnosticResult.orphanedNodes}
              </Badge>
            </HStack>

            <HStack>
              <Badge colorScheme={getStatusColor(diagnosticResult.properlyConnected > 0)}>
                Connected: {diagnosticResult.properlyConnected}
              </Badge>
            </HStack>
          </VStack>

          {/* Issues */}
          {diagnosticResult.issues.length > 0 && (
            <Box mt={4}>
              <Text fontWeight="medium" color="red.600" mb={2}>⚠️ Issues Found:</Text>
              <List spacing={1}>
                {diagnosticResult.issues.map((issue, index) => (
                  <ListItem key={index} fontSize="sm">
                    <ListIcon as={FiAlertTriangle} color="red.500" />
                    {issue}
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Recommendations */}
          <Box mt={4}>
            <Text fontWeight="medium" color="blue.600" mb={2}>💡 Recommendations:</Text>
            <List spacing={1}>
              {diagnosticResult.recommendations.map((rec, index) => (
                <ListItem key={index} fontSize="sm">
                  <ListIcon as={FiCheck} color="blue.500" />
                  {rec}
                </ListItem>
              ))}
            </List>
          </Box>
        </Box>
      )}

      {/* Quick Fix Button */}
      {diagnosticResult && diagnosticResult.issues.length > 0 && (
        <Alert status="warning">
          <AlertIcon />
          <Box>
            <AlertTitle>Project Structure Issues Detected!</AlertTitle>
            <AlertDescription>
              <VStack align="start" spacing={2} mt={2}>
                <Text fontSize="sm">
                  Your project files exist on disk but aren't properly connected in the UI.
                </Text>
                <Button
                  leftIcon={<FiRefreshCw />}
                  colorScheme="orange"
                  size="sm"
                  onClick={() => onForceRebuild?.(projectId)}
                  isLoading={loading}
                  loadingText="Rebuilding..."
                >
                  🔨 Rebuild Project Tree (Recommended)
                </Button>
              </VStack>
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Success State */}
      {diagnosticResult && diagnosticResult.issues.length === 0 && (
        <Alert status="success">
          <AlertIcon />
          <AlertTitle>Project is healthy!</AlertTitle>
          <AlertDescription>
            All files are properly connected and the project structure is correct.
          </AlertDescription>
        </Alert>
      )}

      {/* Raw Data for Debugging */}
      {diagnosticResult && (
        <Box p={3} bg="blue.50" borderRadius="md" _dark={{ bg: "blue.900" }}>
          <Text fontSize="sm" fontWeight="medium" mb={2}>🔍 Raw Node Data:</Text>
          <VStack align="start" spacing={1} fontSize="xs">
            {projectNodes.slice(0, 10).map((node, index) => (
              <Text key={index} fontFamily="mono">
                {node.name} | Type: {node.type} | Parent: {node.parent_id || node.parentId || 'null'} | Hidden: {node.hidden ? 'true' : 'false'}
              </Text>
            ))}
            {projectNodes.length > 10 && (
              <Text color="gray.500">... and {projectNodes.length - 10} more nodes</Text>
            )}
          </VStack>
        </Box>
      )}
    </VStack>
  );
};

export default ProjectDiagnostic;