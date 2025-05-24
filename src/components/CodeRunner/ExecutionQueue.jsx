// src/components/CodeRunner/ExecutionQueue.jsx - Queue management
import React from 'react';
import {
  VStack,
  HStack,
  Button,
  Text,
  Select,
  Flex,
  Badge,
  Box,
} from '@chakra-ui/react';
import {
  FiPlay,
  FiTrash2,
} from 'react-icons/fi';

const ExecutionQueue = ({
  executionQueue,
  executableFiles,
  nodes,
  running,
  pythonInstalled,
  onRunQueue,
  onAddToQueue,
  onRemoveFromQueue,
  onClearQueue,
}) => {
  return (
    <VStack spacing={3} align="stretch">
      <HStack justify="space-between" align="center">
        <Text fontWeight="medium">Execution Queue</Text>
        <HStack spacing={2}>
          <Button
            leftIcon={<FiPlay />}
            colorScheme="blue"
            size="sm"
            onClick={onRunQueue}
            isLoading={running}
            loadingText="Running Queue"
            isDisabled={executionQueue.length === 0 || !pythonInstalled}
          >
            Run Queue ({executionQueue.length})
          </Button>
          <Button
            leftIcon={<FiTrash2 />}
            size="sm"
            variant="outline"
            onClick={onClearQueue}
            isDisabled={executionQueue.length === 0}
          >
            Clear
          </Button>
        </HStack>
      </HStack>

      <HStack wrap="wrap" spacing={3}>
        <Select 
          placeholder="Add file to queue" 
          size="sm" 
          maxW="300px"
          onChange={(e) => {
            if (e.target.value) {
              onAddToQueue(e.target.value);
              e.target.value = '';
            }
          }}
        >
          {executableFiles
            .filter(file => !executionQueue.includes(file.id))
            .map(file => (
            <option key={file.id} value={file.id}>
              {file.name} ({file.extension})
            </option>
          ))}
        </Select>
      </HStack>

      {/* Queue Display */}
      {executionQueue.length > 0 && (
        <VStack align="stretch" spacing={1} maxH="120px" overflowY="auto">
          {executionQueue.map((nodeId, index) => {
            const node = nodes.find(n => n.id === nodeId);
            if (!node) return null;
            
            return (
              <Flex 
                key={`${nodeId}-${index}`}
                justify="space-between"
                align="center"
                p={2}
                bg="gray.50"
                borderRadius="md"
                _dark={{ bg: "gray.700" }}
              >
                <HStack>
                  <Badge size="sm">{index + 1}</Badge>
                  <Text fontSize="sm">{node.name}</Text>
                  <Badge variant="outline" colorScheme="blue">{node.extension}</Badge>
                </HStack>
                <Button 
                  size="xs" 
                  colorScheme="red" 
                  variant="ghost"
                  onClick={() => onRemoveFromQueue(nodeId)}
                >
                  Remove
                </Button>
              </Flex>
            );
          })}
        </VStack>
      )}
    </VStack>
  );
};

export default ExecutionQueue;