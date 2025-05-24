// src/components/FileTree/hooks/useFileTreeLogic.js
import { useState, useRef, useEffect, useCallback } from 'react';
import { useDisclosure, useToast } from '@chakra-ui/react';

export const useFileTreeLogic = ({
  nodes,
  rootId,
  projectId,
  setNodes,
  createFolder,
  createFile,
  renameNode,
  moveNode,
  duplicateNode,
}) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set([rootId]));
  const [renameId, setRenameId] = useState(null);
  const [newName, setNewName] = useState('');
  const [newItemType, setNewItemType] = useState(null);
  const [newItemParentId, setNewItemParentId] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0, nodeId: null });
  const [nodeToMove, setNodeToMove] = useState(null);
  const [renameError, setRenameError] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  
  const renameInputRef = useRef(null);
  const newItemInputRef = useRef(null);
  const contextMenuRef = useRef(null);
  const processedRenames = useRef(new Set());
  const toast = useToast();
  
  const { 
    isOpen: isMoveModalOpen, 
    onOpen: onMoveModalOpen, 
    onClose: onMoveModalClose 
  } = useDisclosure();

  // Auto-rename handling with duplicate prevention
  useEffect(() => {
    if (!nodes || nodes.length === 0) return;
    
    const nodeToRename = nodes.find(node => 
      node.shouldRename && 
      !renameId && 
      !processedRenames.current.has(node.id)
    );
    
    if (nodeToRename) {
      console.log('🔄 Auto-starting rename for new node:', nodeToRename.name);
      processedRenames.current.add(nodeToRename.id);
      setRenameId(nodeToRename.id);
      setNewName(nodeToRename.name);
      
      if (setNodes) {
        setNodes(prevNodes => 
          prevNodes.map(node => 
            node.id === nodeToRename.id 
              ? { ...node, shouldRename: false }
              : node
          )
        );
      }
    }
  }, [nodes, renameId, setNodes]);

  useEffect(() => {
    if (renameId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renameId]);
  
  useEffect(() => {
    if (newItemParentId !== null && newItemInputRef.current) {
      newItemInputRef.current.focus();
      newItemInputRef.current.select();
    }
  }, [newItemParentId]);

  const toggleExpand = useCallback((nodeId) => {
    setExpandedNodes(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId);
      } else {
        newExpanded.add(nodeId);
      }
      return newExpanded;
    });
  }, []);
  
  const handleStartRename = useCallback((node) => {
    if (isRenaming) {
      console.log('⚠️ Rename already in progress, ignoring');
      return;
    }
    
    setRenameId(node.id);
    setNewName(node.name);
    setRenameError('');
    setIsRenaming(true);
  }, [isRenaming]);
  
  const handleRename = useCallback(async () => {
    if (!newName.trim() || !renameId) {
      setRenameError('Name cannot be empty');
      return;
    }
    
    try {
      setRenameError('');
      await renameNode(renameId, newName.trim());
      setRenameId(null);
      setIsRenaming(false);
      
      setTimeout(() => {
        processedRenames.current.delete(renameId);
      }, 1000);
      
    } catch (error) {
      setRenameError(error.message);
      toast({
        title: 'Rename failed',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [newName, renameId, renameNode, toast]);

  const handleCancelRename = useCallback(() => {
    setRenameId(null);
    setRenameError('');
    setIsRenaming(false);
    
    if (renameId) {
      processedRenames.current.delete(renameId);
    }
  }, [renameId]);
  
  const handleStartNewItem = useCallback((parentId, type) => {
    setNewItemParentId(parentId);
    setNewItemType(type);
    setNewItemName(type === 'folder' ? 'New Folder' : 'New File.txt');
  }, []);
  
  const handleCreateNewItem = useCallback(async () => {
    if (!newItemName.trim() || newItemParentId === null) {
      setNewItemParentId(null);
      setNewItemType(null);
      return;
    }
    
    try {
      if (newItemType === 'folder') {
        await createFolder(newItemParentId, newItemName.trim(), projectId, true);
      } else {
        await createFile(newItemParentId, newItemName.trim(), projectId, true);
      }
      
      if (newItemParentId) {
        setExpandedNodes(prev => new Set([...prev, newItemParentId]));
      }
    } catch (error) {
      toast({
        title: 'Failed to create item',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
    
    setNewItemParentId(null);
    setNewItemType(null);
  }, [newItemName, newItemParentId, newItemType, createFolder, createFile, projectId, toast]);

  const handleCancelNewItem = useCallback(() => {
    setNewItemParentId(null);
    setNewItemType(null);
  }, []);
  
  const handleStartMove = useCallback((node) => {
    setNodeToMove(node);
    onMoveModalOpen();
  }, [onMoveModalOpen]);
  
  const handleMoveToFolder = useCallback(async (targetFolderId, targetProjectId) => {
    if (!nodeToMove || !moveNode) {
      console.warn('No node to move or moveNode function not provided');
      return;
    }
    
    try {
      await moveNode(nodeToMove.id, targetFolderId, targetProjectId);
      const movedNodeName = nodeToMove.name;
      setNodeToMove(null);
      onMoveModalClose();
      
      toast({
        title: 'Item moved',
        description: `"${movedNodeName}" has been moved successfully`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Move failed',
        description: error.toString(),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [nodeToMove, moveNode, onMoveModalClose, toast]);
  
  const handleDuplicate = useCallback(async (node) => {
    if (duplicateNode) {
      try {
        await duplicateNode(node.id);
        
        toast({
          title: 'Item duplicated',
          description: `"${node.name}" has been duplicated successfully`,
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: 'Duplication failed',
          description: error.toString(),
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  }, [duplicateNode, toast]);
  
  const handleContextMenu = useCallback((e, nodeId) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      nodeId
    });
  }, []);
  
  const handleKeyDown = useCallback((e, callback, cancelCallback = null) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      callback();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (cancelCallback) {
        cancelCallback();
      } else {
        handleCancelRename();
        handleCancelNewItem();
      }
    }
  }, [handleCancelRename, handleCancelNewItem]);

  return {
    // State
    expandedNodes,
    renameId,
    newName,
    setNewName,
    newItemType,
    newItemParentId,
    newItemName,
    setNewItemName,
    contextMenu,
    setContextMenu,
    nodeToMove,
    renameError,
    isRenaming,
    
    // Refs
    renameInputRef,
    newItemInputRef,
    contextMenuRef,
    
    // Modal state
    isMoveModalOpen,
    onMoveModalOpen,
    onMoveModalClose,
    
    // Handlers
    toggleExpand,
    handleStartRename,
    handleRename,
    handleCancelRename,
    handleStartNewItem,
    handleCreateNewItem,
    handleCancelNewItem,
    handleStartMove,
    handleMoveToFolder,
    handleDuplicate,
    handleContextMenu,
    handleKeyDown,
  };
};