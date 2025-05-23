// src/components/FileDownloadManager.jsx
import React, { useState } from 'react';
import {
  Box,
  Button,
  HStack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { 
  FiDownload,
} from 'react-icons/fi';
import { invoke } from '@tauri-apps/api/tauri';

const FileDownloadManager = ({ 
  projectId, 
  selectedNodes = [], 
  nodes = [] 
}) => {
  const [downloading, setDownloading] = useState(false);
  const toast = useToast();

  const handleDownloadFile = async (node) => {
    try {
      setDownloading(true);

      // Show save dialog
      const savePath = await invoke('show_save_dialog', {
        defaultName: node.name,
      });

      if (!savePath) {
        return; // User cancelled
      }

      // Export the file
      await invoke('export_file', {
        projectId,
        filePath: node.file_path || node.name,
        destPath: savePath,
      });

      toast({
        title: 'File downloaded',
        description: `${node.name} has been saved successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: 'Download failed',
        description: error.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadFolder = async (node) => {
    try {
      setDownloading(true);

      // Show folder dialog for destination
      const savePath = await invoke('show_folder_dialog');

      if (!savePath) {
        return; // User cancelled
      }

      // Export the folder
      await invoke('export_folder', {
        projectId,
        folderPath: node.file_path || node.name,
        destPath: `${savePath}/${node.name}`,
      });

      toast({
        title: 'Folder downloaded',
        description: `${node.name} and its contents have been saved successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Folder download failed:', error);
      toast({
        title: 'Folder download failed',
        description: error.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedNodes.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select files or folders to download',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setDownloading(true);

      // Show folder dialog for destination
      const savePath = await invoke('show_folder_dialog');

      if (!savePath) {
        return; // User cancelled
      }

      // Download each selected item
      for (const nodeId of selectedNodes) {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) continue;

        if (node.type === 'folder') {
          await invoke('export_folder', {
            projectId,
            folderPath: node.file_path || node.name,
            destPath: `${savePath}/${node.name}`,
          });
        } else {
          await invoke('export_file', {
            projectId,
            filePath: node.file_path || node.name,
            destPath: `${savePath}/${node.name}`,
          });
        }
      }

      toast({
        title: 'Download complete',
        description: `${selectedNodes.length} item(s) have been downloaded successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      console.error('Batch download failed:', error);
      toast({
        title: 'Download failed',
        description: error.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setDownloading(false);
    }
  };

  if (selectedNodes.length === 0) {
    return null;
  }

  const selectedNode = nodes.find(n => n.id === selectedNodes[0]);

  return (
    <HStack spacing={2}>
      {selectedNodes.length === 1 && selectedNode && (
        <>
          {selectedNode.type === 'folder' ? (
            <Button
              leftIcon={<FiDownload />}
              size="sm"
              colorScheme="green"
              variant="outline"
              onClick={() => handleDownloadFolder(selectedNode)}
              isLoading={downloading}
              loadingText="Downloading"
            >
              Download Folder
            </Button>
          ) : (
            <Button
              leftIcon={<FiDownload />}
              size="sm"
              colorScheme="blue"
              variant="outline"
              onClick={() => handleDownloadFile(selectedNode)}
              isLoading={downloading}
              loadingText="Downloading"
            >
              Download File
            </Button>
          )}
        </>
      )}
      
      {selectedNodes.length > 1 && (
        <Button
          leftIcon={<FiDownload />}
          size="sm"
          colorScheme="purple"
          variant="outline"
          onClick={handleDownloadSelected}
          isLoading={downloading}
          loadingText="Downloading"
        >
          Download Selected ({selectedNodes.length})
        </Button>
      )}
    </HStack>
  );
};

export default FileDownloadManager;