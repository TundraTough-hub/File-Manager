// src/components/CodeRunner/OutputConsole.jsx - Output display
import React, { useRef, useEffect } from 'react';
import {
  VStack,
  Flex,
  HStack,
  Text,
  Textarea,
  Button,
  Progress,
  Box,
} from '@chakra-ui/react';
import {
  FiTerminal,
  FiTrash2,
} from 'react-icons/fi';

const OutputConsole = ({
  output,
  running,
  autoScroll,
  onClearOutput,
}) => {
  const outputRef = useRef(null);

  // Auto-scroll output to bottom when enabled
  useEffect(() => {
    if (autoScroll && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, autoScroll]);

  return (
    <VStack spacing={3} align="stretch" flex="1" minH="300px">
      {/* Execution Progress */}
      {running && (
        <Box>
          <Progress size="sm" isIndeterminate colorScheme="blue" />
          <Text fontSize="xs" color="gray.600" mt={1} textAlign="center">
            Executing Python code...
          </Text>
        </Box>
      )}

      {/* Console Header */}
      <Flex justify="space-between" align="center">
        <HStack>
          <FiTerminal />
          <Text fontWeight="medium">Console Output</Text>
        </HStack>
        <HStack spacing={2}>
          <Text fontSize="xs" color="gray.500">
            {output.length} characters
          </Text>
          <Button 
            size="xs" 
            variant="ghost" 
            onClick={onClearOutput}
            leftIcon={<FiTrash2 />}
          >
            Clear
          </Button>
        </HStack>
      </Flex>
      
      {/* Console Output */}
      <Textarea
        ref={outputRef}
        value={output}
        readOnly
        flex="1"
        minH="250px"
        fontFamily="Fira Code, Monaco, Consolas, monospace"
        fontSize="sm"
        bg="gray.900"
        color="green.300"
        resize="none"
        placeholder="Output will appear here when you run Python files..."
        _dark={{
          bg: "gray.900",
          color: "green.300"
        }}
        _light={{
          bg: "gray.900",
          color: "green.300"
        }}
      />
    </VStack>
  );
};

export default OutputConsole;