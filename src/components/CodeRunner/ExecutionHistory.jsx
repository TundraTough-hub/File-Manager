// src/components/CodeRunner/ExecutionHistory.jsx - History display
import React from 'react';
import {
  VStack,
  Flex,
  HStack,
  Text,
  Button,
  Icon,
  Badge,
} from '@chakra-ui/react';
import {
  FiCheck,
  FiX,
} from 'react-icons/fi';

const ExecutionHistory = ({
  executionHistory,
  onClearHistory,
}) => {
  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString();
  };

  // Only show if there's history
  if (executionHistory.length === 0) {
    return null;
  }

  return (
    <VStack spacing={3} align="stretch">
      <Flex justify="space-between" align="center">
        <Text fontWeight="medium">Recent Executions</Text>
        <Button size="xs" variant="ghost" onClick={onClearHistory}>
          Clear History
        </Button>
      </Flex>
      
      <VStack align="stretch" spacing={1} maxH="150px" overflowY="auto">
        {executionHistory.slice(-10).reverse().map(exec => (
          <Flex 
            key={exec.id}
            justify="space-between"
            align="center"
            p={2}
            bg={exec.success ? "green.50" : "red.50"}
            borderRadius="md"
            _dark={{ 
              bg: exec.success ? "green.900" : "red.900",
              color: "white"
            }}
          >
            <HStack>
              <Icon as={exec.success ? FiCheck : FiX} 
                    color={exec.success ? "green.500" : "red.500"} />
              <Text fontSize="xs" fontWeight="medium">{exec.fileName}</Text>
              {exec.exitCode !== undefined && (
                <Badge size="sm" colorScheme={exec.success ? "green" : "red"}>
                  Exit: {exec.exitCode}
                </Badge>
              )}
            </HStack>
            <HStack spacing={2} fontSize="xs" color="gray.600">
              <Text>{formatDuration(exec.duration)}</Text>
              <Text>•</Text>
              <Text>{formatTimestamp(exec.timestamp)}</Text>
            </HStack>
          </Flex>
        ))}
      </VStack>
    </VStack>
  );
};

export default ExecutionHistory;