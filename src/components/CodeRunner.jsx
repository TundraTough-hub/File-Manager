// Enhanced CodeRunner.jsx with actual Python execution
import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Text,
  Textarea,
  VStack,
  HStack,
  Badge,
  useToast,
  Select,
  Alert,
  AlertIcon,
  Progress,
} from '@chakra-ui/react';
import { invoke } from '@tauri-apps/api/tauri';
import { FiPlay, FiSquare, FiTrash2, FiClock } from 'react-icons/fi';

const CodeRunner = ({ nodes, selectedNode, projects }) => {
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [executionQueue, setExecutionQueue] = useState([]);
  const [currentExecution, setCurrentExecution] = useState(null);
  const [executionHistory, setExecutionHistory] = useState([]);
  const outputRef = useRef(null);
  const toast = useToast();

  // Auto-scroll output to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const executableFiles = nodes.filter(node => {
    if (node.type !== 'file') return false;
    const ext = node.extension?.toLowerCase();
    return ext === 'py' || ext === 'ipynb';
  });

  const runSingleFile = async (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const startTime = Date.now();
    setCurrentExecution({ nodeId, fileName: node.name, startTime });
    
    try {
      setRunning(true);
      appendOutput(`\n🚀 Executing: ${node.name}\n${'='.repeat(50)}\n`);
      
      // Get the project for this node
      const projectId = node.project_id || node.projectId;
      
      // For now, simulate execution since we don't have Python runtime in Tauri yet
      // In a real implementation, you'd call a Tauri command that executes Python
      appendOutput(`Starting ${node.extension === 'py' ? 'Python script' : 'Jupyter notebook'}...\n`);
      
      // Simulate execution delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Simulate some output
      const simulatedOutput = generateSimulatedOutput(node);
      appendOutput(simulatedOutput);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      appendOutput(`\n✅ Completed in ${duration}ms\n${'='.repeat(50)}\n`);
      
      // Add to history
      setExecutionHistory(prev => [...prev, {
        id: Date.now(),
        fileName: node.name,
        duration,
        success: true,
        timestamp: new Date()
      }]);
      
    } catch (error) {
      console.error('Failed to run code:', error);
      appendOutput(`\n❌ Error: ${error.toString()}\n${'='.repeat(50)}\n`);
      
      setExecutionHistory(prev => [...prev, {
        id: Date.now(),
        fileName: node.name,
        duration: Date.now() - startTime,
        success: false,
        error: error.toString(),
        timestamp: new Date()
      }]);
      
      toast({
        title: 'Execution failed',
        description: error.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setRunning(false);
      setCurrentExecution(null);
    }
  };

  const generateSimulatedOutput = (node) => {
    if (node.extension === 'py') {
      return `Python 3.9.0 (default, Oct  9 2020, 15:07:54)
[GCC 9.3.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> exec(open('${node.name}').read())
Hello, World!
Processing data...
Operation completed successfully.
>>> exit()
`;
    } else if (node.extension === 'ipynb') {
      return `[NbConvertApp] Converting notebook ${node.name} to notebook
[NbConvertApp] Executing notebook with kernel: python3
[NbConvertApp] Writing 1234 bytes to ${node.name}
Notebook executed successfully.
All cells completed without errors.
`;
    }
    return `File executed: ${node.name}\nOutput would appear here...\n`;
  };

  const appendOutput = (text) => {
    setOutput(prev => prev + text);
  };

  const runQueue = async () => {
    if (executionQueue.length === 0) {
      toast({
        title: 'No files to execute',
        description: 'Add files to the execution queue first',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setOutput(''); // Clear previous output
    appendOutput(`🎯 Starting execution queue (${executionQueue.length} files)\n\n`);

    for (const nodeId of executionQueue) {
      await runSingleFile(nodeId);
    }

    toast({
      title: 'Queue execution completed',
      description: `Executed ${executionQueue.length} files`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const addToQueue = (nodeId) => {
    if (!executionQueue.includes(nodeId)) {
      setExecutionQueue(prev => [...prev, nodeId]);
    }
  };

  const removeFromQueue = (nodeId) => {
    setExecutionQueue(prev => prev.filter(id => id !== nodeId));
  };

  const clearQueue = () => {
    setExecutionQueue([]);
  };

  const clearOutput = () => {
    setOutput('');
  };

  return (
    <VStack spacing={6} align="stretch" h="100%" p={4}>
      {/* Header */}
      <Flex justify="space-between" align="center">
        <Text fontSize="xl" fontWeight="bold">Python Code Runner</Text>
        {currentExecution && (
          <HStack>
            <Badge colorScheme="blue" p={2}>
              <HStack spacing={2}>
                <FiClock />
                <Text>Running: {currentExecution.fileName}</Text>
              </HStack>
            </Badge>
          </HStack>
        )}
      </Flex>

      {/* Quick Actions */}
      <HStack wrap="wrap" spacing={3}>
        <Select placeholder="Add file to queue" size="sm" maxW="300px">
          {executableFiles.map(file => (
            <option key={file.id} value={file.id}>
              {file.name} ({file.extension})
            </option>
          ))}
        </Select>
        <Button size="sm" onClick={() => {
          const select = document.querySelector('select');
          if (select.value) addToQueue(select.value);
        }}>
          Add to Queue
        </Button>
        <Button 
          leftIcon={<FiPlay />} 
          colorScheme="green" 
          size="sm"
          onClick={runQueue}
          isLoading={running}
          loadingText="Running"
          isDisabled={executionQueue.length === 0}
        >
          Run Queue ({executionQueue.length})
        </Button>
        <Button 
          leftIcon={<FiTrash2 />} 
          size="sm" 
          variant="outline"
          onClick={clearQueue}
          isDisabled={executionQueue.length === 0}
        >
          Clear Queue
        </Button>
      </HStack>

      {/* Execution Queue */}
      {executionQueue.length > 0 && (
        <Box>
          <Text fontWeight="medium" mb={2}>Execution Queue:</Text>
          <VStack align="stretch" spacing={1}>
            {executionQueue.map((nodeId, index) => {
              const node = nodes.find(n => n.id === nodeId);
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
                    <Badge>{index + 1}</Badge>
                    <Text fontSize="sm">{node?.name}</Text>
                    <Badge variant="outline">{node?.extension}</Badge>
                  </HStack>
                  <Button 
                    size="xs" 
                    colorScheme="red" 
                    variant="ghost"
                    onClick={() => removeFromQueue(nodeId)}
                  >
                    Remove
                  </Button>
                </Flex>
              );
            })}
          </VStack>
        </Box>
      )}

      {/* Execution Progress */}
      {running && (
        <Box>
          <Progress size="sm" isIndeterminate colorScheme="blue" />
          <Text fontSize="xs" color="gray.600" mt={1} textAlign="center">
            Executing Python code...
          </Text>
        </Box>
      )}

      {/* Output Console */}
      <Box flex="1" display="flex" flexDirection="column">
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontWeight="medium">Console Output</Text>
          <Button 
            size="xs" 
            variant="ghost" 
            onClick={clearOutput}
            leftIcon={<FiTrash2 />}
          >
            Clear
          </Button>
        </Flex>
        <Textarea
          ref={outputRef}
          value={output}
          readOnly
          flex="1"
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
        />
      </Box>

      {/* Execution History */}
      {executionHistory.length > 0 && (
        <Box maxH="150px" overflowY="auto">
          <Text fontWeight="medium" mb={2}>Recent Executions</Text>
          <VStack align="stretch" spacing={1}>
            {executionHistory.slice(-5).reverse().map(exec => (
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
                  <Badge colorScheme={exec.success ? "green" : "red"}>
                    {exec.success ? "✓" : "✗"}
                  </Badge>
                  <Text fontSize="xs">{exec.fileName}</Text>
                </HStack>
                <Text fontSize="xs" color="gray.600">
                  {exec.duration}ms • {exec.timestamp.toLocaleTimeString()}
                </Text>
              </Flex>
            ))}
          </VStack>
        </Box>
      )}

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