// src/components/CodeRunner/ExecutionControls.jsx - Buttons and settings
import React from 'react';
import {
  VStack,
  HStack,
  Button,
  Text,
  Switch,
  FormControl,
  FormLabel,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiPlay,
  FiRefreshCw,
  FiTrash2,
} from 'react-icons/fi';

const ExecutionControls = ({
  autoScroll,
  setAutoScroll,
  clearOnRun,
  setClearOnRun,
  autoSyncAfterRun,
  setAutoSyncAfterRun,
  selectedNode,
  selectedFileName,
  pythonInstalled,
  running,
  onRunSelectedFile,
  onManualSync,
  onClearOutput,
  onCheckPython,
}) => {
  return (
    <VStack spacing={4} align="stretch">
      {/* Settings Row */}
      <HStack wrap="wrap" spacing={4} p={3} bg="gray.50" borderRadius="md" _dark={{ bg: "gray.800" }}>
        <FormControl display="flex" alignItems="center" w="auto">
          <FormLabel fontSize="sm" mb="0" mr={2}>Auto-scroll:</FormLabel>
          <Switch size="sm" isChecked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
        </FormControl>
        
        <FormControl display="flex" alignItems="center" w="auto">
          <FormLabel fontSize="sm" mb="0" mr={2}>Clear on run:</FormLabel>
          <Switch size="sm" isChecked={clearOnRun} onChange={(e) => setClearOnRun(e.target.checked)} />
        </FormControl>
        
        <FormControl display="flex" alignItems="center" w="auto">
          <FormLabel fontSize="sm" mb="0" mr={2}>Auto-sync files:</FormLabel>
          <Switch size="sm" isChecked={autoSyncAfterRun} onChange={(e) => setAutoSyncAfterRun(e.target.checked)} />
        </FormControl>
      </HStack>

      {/* Quick Run Controls */}
      <VStack spacing={3} align="stretch">
        <HStack wrap="wrap" spacing={3}>
          <Button
            leftIcon={<FiPlay />}
            colorScheme="green"
            size="md"
            onClick={onRunSelectedFile}
            isLoading={running}
            loadingText="Running"
            isDisabled={!selectedNode || !pythonInstalled}
          >
            Run Selected File
          </Button>
          
          {selectedFileName && (
            <Text fontSize="sm" color="gray.600">
              Selected: {selectedFileName}
            </Text>
          )}
        </HStack>

        {/* Action Buttons */}
        <HStack spacing={2}>
          <Tooltip label="Manual file sync">
            <IconButton
              icon={<FiRefreshCw />}
              size="sm"
              variant="outline"
              colorScheme="purple"
              onClick={onManualSync}
            />
          </Tooltip>
          <Tooltip label="Refresh Python check">
            <IconButton
              icon={<FiRefreshCw />}
              size="sm"
              variant="outline"
              onClick={onCheckPython}
            />
          </Tooltip>
          <Tooltip label="Clear output">
            <IconButton
              icon={<FiTrash2 />}
              size="sm"
              variant="outline"
              onClick={onClearOutput}
            />
          </Tooltip>
        </HStack>
      </VStack>
    </VStack>
  );
};

export default ExecutionControls;