// src/components/CodeRunner.jsx
import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Text,
  Textarea,
  VStack,
  Select,
  HStack,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { invoke } from '@tauri-apps/api/tauri';
import { FiPlay, FiList } from 'react-icons/fi';

const CodeRunner = ({ nodes, selectedNode }) => {
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [runSequence, setRunSequence] = useState([]);
  const toast = useToast();

  const executableFiles = nodes.filter(node => {
    if (node.type !== 'file') return false;
    const ext = node.extension?.toLowerCase();
    return ext === 'py' || ext === 'ipynb';
  });

  const runCode = async (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    try {
      setRunning(true);
      setOutput(prev => prev + `\n--- Running ${node.name} ---\n`);
      
      // Get file content
      const content = await invoke('get_file_content', { nodeId });
      
      // In a real implementation, we would have a Tauri command to run Python code
      // Here we're simulating the execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const simulatedOutput = `Executed ${node.name} successfully.\n`;
      setOutput(prev => prev + simulatedOutput);
      
      setRunning(false);
    } catch (error) {
      console.error('Failed to run code:', error);
      setOutput(prev => prev + `Error: ${error.toString()}\n`);
      setRunning(false);
      
      toast({
        title: 'Error running code',
        description: error.toString(),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const runSequentially = async () => {
    setOutput('');
    
    for (const nodeId of runSequence) {
      await runCode(nodeId);
    }
    
    toast({
      title: 'Execution complete',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const addToSequence = () => {
    if (!selectedFiles.length) return;
    
    setRunSequence([...runSequence, ...selectedFiles]);
    setSelectedFiles([]);
  };

  const removeFromSequence = (index) => {
    setRunSequence(runSequence.filter((_, i) => i !== index));
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="md">
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        Code Runner
      </Text>
      
      <VStack spacing={6} align="stretch">
        {/* File Selection */}
        <Box>
          <Text fontWeight="medium" mb={2}>
            Add Files to Run Queue
          </Text>
          <HStack>
            <Select 
              placeholder="Select Python files to run" 
              value=""
              onChange={(e) => {
                const value = e.target.value;
                if (value && !selectedFiles.includes(value)) {
                  setSelectedFiles([...selectedFiles, value]);
                }
              }}
            >
              {executableFiles.map(file => (
                <option key={file.id} value={file.id}>
                  {file.name}
                </option>
              ))}
            </Select>
            <Button 
              leftIcon={<FiList />} 
              onClick={addToSequence}
              isDisabled={selectedFiles.length === 0}
            >
              Add
            </Button>
          </HStack>
          
          {selectedFiles.length > 0 && (
            <Flex wrap="wrap" mt={2} gap={2}>
              {selectedFiles.map(fileId => {
                const file = nodes.find(n => n.id === fileId);
                return (
                  <Badge key={fileId} colorScheme="blue" p={1}>
                    {file?.name}
                  </Badge>
                );
              })}
            </Flex>
          )}
        </Box>
        
        {/* Run Sequence */}
        <Box>
          <Text fontWeight="medium" mb={2}>
            Run Sequence
          </Text>
          
          {runSequence.length > 0 ? (
            <VStack align="stretch" spacing={2}>
              {runSequence.map((nodeId, index) => {
                const node = nodes.find(n => n.id === nodeId);
                return (
                  <Flex 
                    key={`${nodeId}-${index}`}
                    justify="space-between"
                    align="center"
                    p={2}
                    borderWidth="1px"
                    borderRadius="md"
                  >
                    <Text>{index + 1}. {node?.name}</Text>
                    <Button 
                      size="xs" 
                      colorScheme="red" 
                      onClick={() => removeFromSequence(index)}
                    >
                      Remove
                    </Button>
                  </Flex>
                );
              })}
              
              <Button 
                leftIcon={<FiPlay />} 
                colorScheme="green" 
                mt={2}
                onClick={runSequentially}
                isLoading={running}
                loadingText="Running"
              >
                Run All
              </Button>
            </VStack>
          ) : (
            <Text color="gray.500">
              Add files to create a run sequence
            </Text>
          )}
        </Box>
        
        {/* Output Console */}
        <Box>
          <Text fontWeight="medium" mb={2}>
            Output
          </Text>
          <Textarea
            value={output}
            readOnly
            h="200px"
            fontFamily="monospace"
            bg="gray.800"
            color="white"
            resize="vertical"
          />
        </Box>
      </VStack>
    </Box>
  );
};

export default CodeRunner;