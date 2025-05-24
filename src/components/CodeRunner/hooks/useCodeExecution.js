// src/components/CodeRunner/hooks/useCodeExecution.js - Main execution logic hook
import { useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { invoke } from '@tauri-apps/api/tauri';

export const useCodeExecution = ({
  nodes,
  selectedNode,
  projects,
  onFilesSync,
  pythonInstalled,
}) => {
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [executionQueue, setExecutionQueue] = useState([]);
  const [currentExecution, setCurrentExecution] = useState(null);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [clearOnRun, setClearOnRun] = useState(true);
  const [autoSyncAfterRun, setAutoSyncAfterRun] = useState(true);
  
  const toast = useToast();

  const appendOutput = useCallback((text) => {
    setOutput(prev => prev + text);
  }, []);

  // Auto-sync files after execution
  const autoSyncFiles = useCallback(async (projectId) => {
    if (!autoSyncAfterRun || !projectId) return;
    
    try {
      appendOutput(`\n🔄 Auto-syncing files...\n`);
      
      const newFiles = await invoke('sync_external_files', {
        projectId,
      });
      
      if (newFiles.length > 0) {
        appendOutput(`✅ Found ${newFiles.length} new file(s) created by your script\n`);
        
        // Notify parent component to update the file tree
        if (onFilesSync) {
          onFilesSync(newFiles);
        }
        
        // Show new files in output
        newFiles.forEach(file => {
          const fileType = file.type === 'folder' ? '📁' : '📄';
          appendOutput(`   ${fileType} ${file.name}\n`);
        });
        
        toast({
          title: 'Files auto-synced',
          description: `${newFiles.length} new file(s) added to project`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        appendOutput(`✅ No new files created\n`);
      }
    } catch (error) {
      console.error('❌ Auto-sync failed:', error);
      appendOutput(`⚠️ Auto-sync failed: ${error}\n`);
    }
  }, [autoSyncAfterRun, appendOutput, onFilesSync, toast]);

  const runSingleFile = useCallback(async (nodeId) => {
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
        
        // Auto-sync files after successful execution
        await autoSyncFiles(projectId);
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
  }, [nodes, appendOutput, autoSyncFiles, toast]);

  const runQueue = useCallback(async () => {
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
  }, [pythonInstalled, executionQueue, clearOnRun, appendOutput, runSingleFile, toast]);

  const runSelectedFile = useCallback(async () => {
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
  }, [selectedNode, nodes, pythonInstalled, clearOnRun, runSingleFile, toast]);

  // Manual sync function
  const manualSyncFiles = useCallback(async () => {
    const selectedNodeData = nodes.find(n => n.id === selectedNode);
    const projectId = selectedNodeData?.project_id || selectedNodeData?.projectId;
    
    if (!projectId) {
      toast({
        title: 'No project selected',
        description: 'Please select a file from a project to sync',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    await autoSyncFiles(projectId);
  }, [nodes, selectedNode, autoSyncFiles, toast]);

  const addToQueue = useCallback((nodeId) => {
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
  }, [executionQueue, nodes, toast]);

  const removeFromQueue = useCallback((nodeId) => {
    setExecutionQueue(prev => prev.filter(id => id !== nodeId));
  }, []);

  const clearQueue = useCallback(() => {
    setExecutionQueue([]);
  }, []);

  const clearOutput = useCallback(() => {
    setOutput('');
  }, []);

  const clearHistory = useCallback(() => {
    setExecutionHistory([]);
  }, []);

  return {
    // State
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
    
    // Actions
    runSingleFile,
    runQueue,
    runSelectedFile,
    manualSyncFiles,
    addToQueue,
    removeFromQueue,
    clearQueue,
    clearOutput,
    clearHistory,
    appendOutput,
  };
};