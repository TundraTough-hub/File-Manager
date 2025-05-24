// Enhanced CodeRunner.jsx with REAL Python execution
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
  Divider,
  IconButton,
  Tooltip,
  Switch,
  FormControl,
  FormLabel,
  Icon,
} from '@chakra-ui/react';
import { invoke } from '@tauri-apps/api/tauri';
import { 
  FiPlay, 
  FiSquare, 
  FiTrash2, 
  FiClock, 
  FiCheck, 
  FiX, 
  FiZap,
  FiSettings,
  FiRefreshCw,
  FiTerminal,
} from 'react-icons/fi';

const CodeRunner = ({ nodes, selectedNode, projects }) => {
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [executionQueue, setExecutionQueue] = useState([]);
  const [currentExecution, setCurrentExecution] = useState(null);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [pythonInstalled, setPythonInstalled] = useState(null);
  const [availablePythonCommands, setAvailablePythonCommands] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [clearOnRun, setClearOnRun] = useState(true);
  
  const outputRef = useRef(null);
  const toast = useToast();

  // Check Python installation on component mount
  useEffect(() => {
    checkPythonInstallation();
  }, []);

  // Auto-scroll output to bottom when enabled
  useEffect(() => {
    if (autoScroll && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, autoScroll]);

  const checkPythonInstallation = async () => {
    try {
      console.log('🐍 Checking Python installation...');
      const pythonCommands = await invoke('check_python_installation');
      setAvailablePythonCommands(pythonCommands);
      setPythonInstalled(pythonCommands.length > 0);
      
      if (pythonCommands.length > 0) {
        appendOutput(`✅ Python found: ${pythonCommands.join(', ')}\n`);
        console.log('✅ Python commands available:', pythonCommands);
      } else {
        appendOutput(`❌ No Python installation found\n`);
        console.log('❌ No Python installation found');
      }
    } catch (error) {
      console.error('❌ Failed to check Python installation:', error);
      setPythonInstalled(false);
      appendOutput(`❌ Failed to check Python installation: ${error}\n`);
    }
  };

  const executableFiles = nodes.filter(node => {
    if (node.type !== 'file') return false;
    const ext = node.extension?.toLowerCase();
    return ext === 'py' || ext === 'ipynb';
  });

  const runSingleFile = async (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) {
      appendOutput(`❌ Error: File not found (ID: ${nodeId})\n`);
      return { success: false, error: 'File not found' };
    }

    const startTime = Date.now();
    setCurrentExecution({ nodeId, fileName: node.name, startTime });
    
    try {
      appendOutput(`\n🚀 Executing: ${node.name}\n${'='.repeat(50)}\n`);
      
      // Get the project for this node
      const projectId = node.project_id || node.projectId;
      const filePath = node.file_path || node.name;
      
      console.log('🐍 Executing Python file:', {
        nodeId,
        filePath,
        projectId,
        extension: node.extension
      });

      let result;
      
      if (node.extension?.toLowerCase() === 'py') {
        // Execute Python script
        result = await invoke('execute_python_file', {
          nodeId,
          filePath,
          projectId,
        });
      } else if (node.extension?.toLowerCase() === 'ipynb') {
        // Execute Jupyter notebook
        result = await invoke('execute_jupyter_notebook', {
          nodeId,
          filePath,
          projectId,
        });
      } else {
        throw new Error(`Unsupported file type: ${node.extension}`);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Display results
      if (result.stdout && result.stdout.trim()) {
        appendOutput(`📤 Output:\n${result.stdout}\n`);
      }
      
      if (result.stderr && result.stderr.trim()) {
        appendOutput(`⚠️ Errors/Warnings:\n${result.stderr}\n`);
      }
      
      if (result.success) {
        appendOutput(`✅ Completed successfully in ${duration}ms\n`);
      } else {
        appendOutput(`❌ Execution failed (Exit code: ${result.exit_code || 'unknown'})\n`);
      }
      
      appendOutput(`${'='.repeat(50)}\n`);
      
      // Add to history
      const executionRecord = {
        id: Date.now(),
        fileName: node.name,
        duration,
        success: result.success,
        timestamp: new Date(),
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exit_code,
      };
      
      setExecutionHistory(prev => [...prev, executionRecord]);
      
      return executionRecord;
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const errorMessage = error.toString();
      
      console.error('❌ Python execution failed:', error);
      appendOutput(`\n❌ Error: ${errorMessage}\n${'='.repeat(50)}\n`);
      
      const executionRecord = {
        id: Date.now(),
        fileName: node.name,
        duration,
        success: false,
        error: errorMessage,
        timestamp: new Date(),
      };
      
      setExecutionHistory(prev => [...prev, executionRecord]);
      
      toast({
        title: 'Execution failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      return executionRecord;
    } finally {
      setCurrentExecution(null);
    }
  };

  const appendOutput = (text) => {
    setOutput(prev => prev + text);
  };

  const runQueue = async () => {
    if (!pythonInstalled) {
      toast({
        title: 'Python not found',
        description: 'Please install Python to run files',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

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

    try {
      setRunning(true);
      
      if (clearOnRun) {
        setOutput('');
      }
      
      appendOutput(`🎯 Starting execution queue (${executionQueue.length} files)\n`);
      appendOutput(`📅 ${new Date().toLocaleString()}\n\n`);

      let successCount = 0;
      let failureCount = 0;

      for (let i = 0; i < executionQueue.length; i++) {
        const nodeId = executionQueue[i];
        appendOutput(`\n📋 Queue Progress: ${i + 1}/${executionQueue.length}\n`);
        
        const result = await runSingleFile(nodeId);
        
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
        
        // Small delay between executions to prevent overwhelming the system
        if (i < executionQueue.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      appendOutput(`\n🏁 Queue execution completed!\n`);
      appendOutput(`✅ Successful: ${successCount}\n`);
      appendOutput(`❌ Failed: ${failureCount}\n`);
      appendOutput(`⏱️ Total files: ${executionQueue.length}\n\n`);

      toast({
        title: 'Queue execution completed',
        description: `${successCount} successful, ${failureCount} failed`,
        status: successCount > 0 ? 'success' : 'error',
        duration: 3000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('❌ Queue execution failed:', error);
      appendOutput(`\n❌ Queue execution failed: ${error}\n`);
      
      toast({
        title: 'Queue execution failed',
        description: error.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setRunning(false);
    }
  };

  const runSelectedFile = async () => {
    if (!selectedNode) {
      toast({
        title: 'No file selected',
        description: 'Please select a Python file to run',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const node = nodes.find(n => n.id === selectedNode);
    if (!node || node.type !== 'file' || !['py', 'ipynb'].includes(node.extension?.toLowerCase())) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a .py or .ipynb file',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!pythonInstalled) {
      toast({
        title: 'Python not found',
        description: 'Please install Python to run files',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setRunning(true);
      
      if (clearOnRun) {
        setOutput('');
      }
      
      await runSingleFile(selectedNode);
      
    } catch (error) {
      console.error('❌ Failed to run selected file:', error);
    } finally {
      setRunning(false);
    }
  };

  const addToQueue = (nodeId) => {
    if (!executionQueue.includes(nodeId)) {
      setExecutionQueue(prev => [...prev, nodeId]);
      
      const node = nodes.find(n => n.id === nodeId);
      toast({
        title: 'Added to queue',
        description: `${node?.name} added to execution queue`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
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

  const clearHistory = () => {
    setExecutionHistory([]);
  };

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString();
  };

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

        <HStack spacing={2}>
          <Tooltip label="Refresh Python check">
            <IconButton
              icon={<FiRefreshCw />}
              size="sm"
              variant="outline"
              onClick={checkPythonInstallation}
            />
          </Tooltip>
          <Tooltip label="Clear output">
            <IconButton
              icon={<FiTrash2 />}
              size="sm"
              variant="outline"
              onClick={clearOutput}
            />
          </Tooltip>
        </HStack>
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
      </HStack>

      {/* Control Panel */}
      <VStack spacing={4} align="stretch">
        {/* Quick Run */}
        <HStack wrap="wrap" spacing={3}>
          <Button
            leftIcon={<FiPlay />}
            colorScheme="green"
            size="md"
            onClick={runSelectedFile}
            isLoading={running}
            loadingText="Running"
            isDisabled={!selectedNode || !pythonInstalled}
          >
            Run Selected File
          </Button>
          
          {getSelectedFileName() && (
            <Text fontSize="sm" color="gray.600">
              Selected: {getSelectedFileName()}
            </Text>
          )}
        </HStack>

        <Divider />

        {/* Queue Management */}
        <VStack spacing={3} align="stretch">
          <HStack justify="space-between" align="center">
            <Text fontWeight="medium">Execution Queue</Text>
            <HStack spacing={2}>
              <Button
                leftIcon={<FiPlay />}
                colorScheme="blue"
                size="sm"
                onClick={runQueue}
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
                onClick={clearQueue}
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
                  addToQueue(e.target.value);
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
                      onClick={() => removeFromQueue(nodeId)}
                    >
                      Remove
                    </Button>
                  </Flex>
                );
              })}
            </VStack>
          )}
        </VStack>
      </VStack>

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
      <VStack spacing={3} align="stretch" flex="1" minH="300px">
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
              onClick={clearOutput}
              leftIcon={<FiTrash2 />}
            >
              Clear
            </Button>
          </HStack>
        </Flex>
        
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

      {/* Execution History */}
      {executionHistory.length > 0 && (
        <VStack spacing={3} align="stretch">
          <Flex justify="space-between" align="center">
            <Text fontWeight="medium">Recent Executions</Text>
            <Button size="xs" variant="ghost" onClick={clearHistory}>
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