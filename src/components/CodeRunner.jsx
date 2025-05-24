// src/components/CodeRunner/CodeRunner.jsx - Main orchestrating component
import React from 'react';
import {
  VStack,
  Box,
  Alert,
  AlertIcon,
  Text,
  HStack,
  Flex,
  Badge,
  Divider,
} from '@chakra-ui/react';
import { FiClock } from 'react-icons/fi';
import ExecutionControls from './CodeRunner/ExecutionControls';
import ExecutionQueue from './CodeRunner/ExecutionQueue';
import OutputConsole from './CodeRunner/OutputConsole';
import ExecutionHistory from './CodeRunner/ExecutionHistory';
import { useCodeExecution } from './CodeRunner/hooks/useCodeExecution';
import { usePythonEnvironment } from './CodeRunner/hooks/usePythonEnvironment';

const CodeRunner = ({ nodes, selectedNode, projects, onFilesSync }) => {
  const {
    pythonInstalled,
    availablePythonCommands,
    checkPythonInstallation,
  } = usePythonEnvironment();

  const {
    running,
    output,
    setOutput,
    executionQueue,
    setExecutionQueue,
    currentExecution,
    executionHistory,
    setExecutionHistory,
    autoScroll,
    setAutoScroll,
    clearOnRun,
    setClearOnRun,
    autoSyncAfterRun,
    setAutoSyncAfterRun,
    runSingleFile,
    runQueue,
    runSelectedFile,
    manualSyncFiles,
    addToQueue,
    removeFromQueue,
    clearQueue,
    clearOutput,
    clearHistory,
  } = useCodeExecution({
    nodes,
    selectedNode,
    projects,
    onFilesSync,
    pythonInstalled,
  });

  // Filter executable files
  const executableFiles = nodes.filter(node => {
    if (node.type !== 'file') return false;
    const ext = node.extension?.toLowerCase();
    return ext === 'py' || ext === 'ipynb';
  });

  const getSelectedFileName = () => {
    if (!selectedNode) return null;
    const node = nodes.find(n => n.id === selectedNode);
    return node?.name;
  };

  return (
    <VStack spacing={6} align="stretch" h="100%" p={4}>
      {/* Header */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
        <VStack align="start" spacing={1}>
          <Text fontSize="xl" fontWeight="bold">Python Code Runner</Text>
          <HStack spacing={2}>
            {pythonInstalled === true && (
              <Badge colorScheme="green" variant="subtle">
                ✅ Python Ready
              </Badge>
            )}
            {pythonInstalled === false && (
              <Badge colorScheme="red" variant="subtle">
                ❌ Python Not Found
              </Badge>
            )}
            {currentExecution && (
              <Badge colorScheme="blue" p={2}>
                <HStack spacing={2}>
                  <FiClock />
                  <Text>Running: {currentExecution.fileName}</Text>
                </HStack>
              </Badge>
            )}
          </HStack>
        </VStack>
      </Flex>

      {/* Python Installation Warning */}
      {pythonInstalled === false && (
        <Alert status="error">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontWeight="medium">Python not found</Text>
            <Text fontSize="sm">
              Please install Python and ensure it's available in your system PATH. 
              Try running 'python --version' or 'python3 --version' in your terminal.
            </Text>
          </VStack>
        </Alert>
      )}

      {/* Execution Controls */}
      <ExecutionControls
        autoScroll={autoScroll}
        setAutoScroll={setAutoScroll}
        clearOnRun={clearOnRun}
        setClearOnRun={setClearOnRun}
        autoSyncAfterRun={autoSyncAfterRun}
        setAutoSyncAfterRun={setAutoSyncAfterRun}
        selectedNode={selectedNode}
        selectedFileName={getSelectedFileName()}
        pythonInstalled={pythonInstalled}
        running={running}
        onRunSelectedFile={runSelectedFile}
        onManualSync={manualSyncFiles}
        onClearOutput={clearOutput}
        onCheckPython={checkPythonInstallation}
      />

      <Divider />

      {/* Execution Queue */}
      <ExecutionQueue
        executionQueue={executionQueue}
        executableFiles={executableFiles}
        nodes={nodes}
        running={running}
        pythonInstalled={pythonInstalled}
        onRunQueue={runQueue}
        onAddToQueue={addToQueue}
        onRemoveFromQueue={removeFromQueue}
        onClearQueue={clearQueue}
      />

      {/* Output Console */}
      <OutputConsole
        output={output}
        running={running}
        autoScroll={autoScroll}
        onClearOutput={clearOutput}
      />

      {/* Execution History */}
      <ExecutionHistory
        executionHistory={executionHistory}
        onClearHistory={clearHistory}
      />

      {/* No Python files message */}
      {executableFiles.length === 0 && (
        <Alert status="info">
          <AlertIcon />
          <Box>
            <Text fontWeight="medium">No Python files found</Text>
            <Text fontSize="sm">Create some .py or .ipynb files to get started!</Text>
          </Box>
        </Alert>
      )}
    </VStack>
  );
};

export default CodeRunner;