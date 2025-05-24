// src/components/FileTree/components/FileTreeContextMenu.jsx
import React from 'react';
import {
  Box,
  VStack,
  Icon,
} from '@chakra-ui/react';
import { 
  FiPlus,
  FiEdit,
  FiMove,
  FiCopy,
  FiTrash2,
  FiInfo, // Add this import
} from 'react-icons/fi';

const FileTreeContextMenu = ({
  contextMenu,
  contextMenuRef,
  nodes,
  isRenaming,
  handleStartNewItem,
  handleStartRename,
  handleStartMove,
  handleDuplicate,
  confirmDelete,
  setContextMenu,
}) => {
  if (!contextMenu.isOpen) return null;

  const node = nodes.find(n => n.id === contextMenu.nodeId);
  if (!node) return null;

  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  return (
    <Box
      ref={contextMenuRef}
      position="fixed"
      left={`${contextMenu.x}px`}
      top={`${contextMenu.y}px`}
      zIndex="dropdown"
      bg="white"
      boxShadow="lg"
      borderRadius="md"
      borderWidth="1px"
      py={1}
      _dark={{
        bg: "gray.800",
        borderColor: "gray.700"
      }}
      minW="160px"
    >
      <VStack spacing={0} align="stretch">
        {node.type === 'folder' && (
          <>
            <Box
              px={3}
              py={2}
              cursor="pointer"
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
              onClick={() => {
                handleStartNewItem(contextMenu.nodeId, 'folder');
                closeContextMenu();
              }}
              fontSize="sm"
              display="flex"
              alignItems="center"
            >
              <Icon as={FiPlus} mr={2} />
              New Folder
            </Box>
            <Box
              px={3}
              py={2}
              cursor="pointer"
              _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
              onClick={() => {
                handleStartNewItem(contextMenu.nodeId, 'file');
                closeContextMenu();
              }}
              fontSize="sm"
              display="flex"
              alignItems="center"
            >
              <Icon as={FiPlus} mr={2} />
              New File
            </Box>
          </>
        )}
        <Box
          px={3}
          py={2}
          cursor="pointer"
          _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
          onClick={() => {
            handleStartRename(node);
            closeContextMenu();
          }}
          fontSize="sm"
          display="flex"
          alignItems="center"
          opacity={isRenaming ? 0.5 : 1}
          pointerEvents={isRenaming ? 'none' : 'auto'}
        >
          <Icon as={FiEdit} mr={2} />
          Rename
        </Box>
        <Box
          px={3}
          py={2}
          cursor="pointer"
          _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
          onClick={() => {
            handleStartMove(node);
            closeContextMenu();
          }}
          fontSize="sm"
          display="flex"
          alignItems="center"
        >
          <Icon as={FiMove} mr={2} />
          Move
        </Box>
        <Box
          px={3}
          py={2}
          cursor="pointer"
          _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
          onClick={() => {
            handleDuplicate(node);
            closeContextMenu();
          }}
          fontSize="sm"
          display="flex"
          alignItems="center"
        >
          <Icon as={FiCopy} mr={2} />
          Duplicate
        </Box>
        {/* Add Properties menu item here - available for all file types */}
        <Box
          px={3}
          py={2}
          cursor="pointer"
          _hover={{ bg: 'gray.100', _dark: { bg: 'gray.700' } }}
          onClick={() => {
            // Add file properties/details view
            console.log('Show properties for:', node);
            closeContextMenu();
          }}
          fontSize="sm"
          display="flex"
          alignItems="center"
        >
          <Icon as={FiInfo} mr={2} />
          Properties
        </Box>
        <Box
          px={3}
          py={2}
          cursor="pointer"
          _hover={{ bg: 'red.100', _dark: { bg: 'red.900' } }}
          onClick={() => {
            confirmDelete(contextMenu.nodeId);
            closeContextMenu();
          }}
          fontSize="sm"
          display="flex"
          alignItems="center"
          color="red.500"
        >
          <Icon as={FiTrash2} mr={2} />
          Delete
        </Box>
      </VStack>
    </Box>
  );
};

export default FileTreeContextMenu;