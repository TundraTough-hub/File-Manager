// src/components/EnhancedFileTree.jsx
import React, { useState } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  HStack, 
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import FileTree from './FileTree';
import FileUploadManager from './FileUploadManager';
import FileDownloadManager from './FileDownloadManager';

const EnhancedFileTree = ({
  nodes,
  rootId,
  projectId,
  selectedNode,
  setSelectedNode,
  createFolder,
  createFile,
  renameNode,
  confirmDelete,
  moveNode,
  duplicateNode,
  projects,
  setNodes,
}) => {
  const [selectedNodes, setSelectedNodes] = useState([]);
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleFileUploaded = (newNode) => {
    // Add the new node to the nodes array
    setNodes(prevNodes => [...prevNodes, newNode]);
  };

  const handleFolderUploaded = (newNode) => {
    // Add the new folder node to the nodes array
    setNodes(prevNodes => [...prevNodes, newNode]);
  };

  const handleNodeSelect = (nodeId) => {
    setSelectedNode(nodeId);
    
    // Toggle selection for download manager
    setSelectedNodes(prev => {
      if (prev.includes(nodeId)) {
        return prev.filter(id => id !== nodeId);
      } else {
        return [...prev, nodeId];
      }
    });
  };

  return (
    <Box>
      {/* Upload/Download Controls */}
      <Box p={4} borderBottom="1px" borderColor={borderColor}>
        <VStack spacing={3} align="stretch">
          <Flex justify="space-between" align="center">
            <Text fontSize="sm" fontWeight="medium" color="gray.600">
              File Operations
            </Text>
          </Flex>
          
          <HStack justify="space-between" wrap="wrap">
            <FileUploadManager
              projectId={projectId}
              currentFolderId={selectedNode}
              onFileUploaded={handleFileUploaded}
              onFolderUploaded={handleFolderUploaded}
            />
            
            <FileDownloadManager
              projectId={projectId}
              selectedNodes={selectedNodes}
              nodes={nodes}
            />
          </HStack>
          
          {selectedNodes.length > 0 && (
            <Text fontSize="xs" color="gray.500">
              {selectedNodes.length} item(s) selected for download
            </Text>
          )}
        </VStack>
      </Box>

      {/* File Tree */}
      <Box>
        <FileTree
          nodes={nodes}
          rootId={rootId}
          projectId={projectId}
          selectedNode={selectedNode}
          setSelectedNode={handleNodeSelect}
          createFolder={createFolder}
          createFile={createFile}
          renameNode={renameNode}
          confirmDelete={confirmDelete}
          moveNode={moveNode}
          duplicateNode={duplicateNode}
          projects={projects}
          setNodes={setNodes}
        />
      </Box>
    </Box>
  );
};

export default EnhancedFileTree;