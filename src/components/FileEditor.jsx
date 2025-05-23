// src/components/FileEditor.jsx - Fixed version with proper API calls
import { useState, useEffect } from 'react';
import { Box, Textarea, Button, Flex, useToast, Alert, AlertIcon } from '@chakra-ui/react';
import { invoke } from '@tauri-apps/api/tauri';

const FileEditor = ({ nodeId, nodes }) => {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isBinary, setIsBinary] = useState(false);
  const toast = useToast();
  
  // Find the current node to get file path and project info
  const currentNode = nodes.find(n => n.id === nodeId);
  
  useEffect(() => {
    if (nodeId && currentNode) {
      loadContent();
    }
  }, [nodeId, currentNode]);
  
  const loadContent = async () => {
    if (!currentNode) return;
    
    try {
      setIsLoading(true);
      const fileContent = await invoke('get_file_content', { 
        nodeId: nodeId,
        filePath: currentNode.file_path || currentNode.name,
        projectId: currentNode.project_id || currentNode.projectId
      });
      
      // Check if it's a binary file
      if (fileContent === '[Binary file - content not displayable]') {
        setIsBinary(true);
        setContent('');
      } else {
        setIsBinary(false);
        setContent(fileContent);
      }
    } catch (error) {
      console.error('Failed to load file content:', error);
      toast({
        title: 'Error loading file',
        description: error.toString(),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveContent = async () => {
    if (!currentNode || isBinary) return;
    
    try {
      setIsSaving(true);
      await invoke('save_file_content', { 
        nodeId: nodeId,
        content: content,
        filePath: currentNode.file_path || currentNode.name,
        projectId: currentNode.project_id || currentNode.projectId
      });
      
      toast({
        title: 'File saved',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Failed to save file content:', error);
      toast({
        title: 'Error saving file',
        description: error.toString(),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentNode) {
    return (
      <Box p={4}>
        <Alert status="warning">
          <AlertIcon />
          No file selected or file not found.
        </Alert>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box p={4}>
        <Alert status="info">
          <AlertIcon />
          Loading file content...
        </Alert>
      </Box>
    );
  }

  if (isBinary) {
    return (
      <Box p={4}>
        <Alert status="info">
          <AlertIcon />
          This is a binary file and cannot be edited in the text editor. Use the Data Preview tab to view file information.
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box h="100%" display="flex" flexDirection="column">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        flex="1"
        mb={4}
        fontFamily="monospace"
        placeholder="Start typing your code here..."
        resize="none"
      />
      <Flex justify="flex-end">
        <Button 
          colorScheme="blue" 
          onClick={saveContent}
          isLoading={isSaving}
          loadingText="Saving..."
          isDisabled={isBinary}
        >
          Save
        </Button>
      </Flex>
    </Box>
  );
};

export default FileEditor;