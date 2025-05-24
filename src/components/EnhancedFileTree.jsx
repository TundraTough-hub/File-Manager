// src/components/EnhancedFileTree.jsx - COMPLETELY FIXED VERSION
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
    console.log('📁 FIXED: EnhancedFileTree received uploaded file:', newNode);
    console.log('📁 FIXED: File parent_id:', newNode.parent_id);
    console.log('📁 FIXED: File project_id:', newNode.project_id);
    
    // Add the new node to the nodes array if it doesn't already exist
    setNodes(prevNodes => {
      const nodeExists = prevNodes.some(n => n.id === newNode.id);
      if (nodeExists) {
        console.log('⚠️ FIXED: Node already exists, skipping addition');
        return prevNodes;
      }
      
      console.log('✅ FIXED: Adding new node to tree with proper parent relationship');
      return [...prevNodes, newNode];
    });
  };

  const handleFolderUploaded = (newNode) => {
    console.log('📁 FIXED: EnhancedFileTree received uploaded folder:', newNode);
    console.log('📁 FIXED: Folder parent_id:', newNode.parent_id);
    console.log('📁 FIXED: Folder project_id:', newNode.project_id);
    
    // Add the new folder node to the nodes array if it doesn't already exist
    setNodes(prevNodes => {
      const nodeExists = prevNodes.some(n => n.id === newNode.id);
      if (nodeExists) {
        console.log('⚠️ FIXED: Folder already exists, skipping addition');
        return prevNodes;
      }
      
      console.log('✅ FIXED: Adding new folder to tree with proper parent relationship');
      return [...prevNodes, newNode];
    });
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

  // FIXED: Determine the current folder for uploads
  const getCurrentFolderId = () => {
    // If a folder is selected in the tree, use that
    if (selectedNode) {
      const selectedNodeData = nodes.find(n => n.id === selectedNode);
      if (selectedNodeData && selectedNodeData.type === 'folder') {
        console.log('📁 FIXED: Using selected folder as upload target:', selectedNode);
        return selectedNode;
      }
    }
    
    // Otherwise, use the project root
    console.log('📁 FIXED: Using project root as upload target:', rootId);
    return rootId;
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
              currentFolderId={getCurrentFolderId()}  // FIXED: Pass the correctly determined folder
              onFileUploaded={handleFileUploaded}
              onFolderUploaded={handleFolderUploaded}
              nodes={nodes}  // FIXED: Pass all nodes for parent determination
              rootId={rootId}  // FIXED: Pass the root ID
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