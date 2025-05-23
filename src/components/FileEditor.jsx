// src/components/FileEditor.jsx
import { useState, useEffect } from 'react';
import { Box, Textarea, Button, Flex, useToast } from '@chakra-ui/react';
import { invoke } from '@tauri-apps/api/tauri';

const FileEditor = ({ nodeId }) => {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();
  
  useEffect(() => {
    if (nodeId) {
      loadContent();
    }
  }, [nodeId]);
  
  const loadContent = async () => {
    try {
      const fileContent = await invoke('get_file_content', { nodeId });
      setContent(fileContent);
    } catch (error) {
      console.error('Failed to load file content:', error);
      toast({
        title: 'Error loading file',
        description: error.toString(),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const saveContent = async () => {
    try {
      setIsSaving(true);
      await invoke('save_file_content', { nodeId, content });
      setIsSaving(false);
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
      setIsSaving(false);
    }
  };
  
  return (
    <Box h="100%" display="flex" flexDirection="column">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        flex="1"
        mb={4}
        fontFamily="monospace"
        placeholder="Start typing your code here..."
      />
      <Flex justify="flex-end">
        <Button 
          colorScheme="blue" 
          onClick={saveContent}
          isLoading={isSaving}
        >
          Save
        </Button>
      </Flex>
    </Box>
  );
};

export default FileEditor;