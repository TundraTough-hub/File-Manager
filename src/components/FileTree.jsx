// src/components/FileTree.jsx - REFACTORED Main Component
import React, { useCallback } from 'react';
import { 
  Box, 
  Flex, 
  Icon, 
  Input,
  useColorModeValue,
  useOutsideClick,
} from '@chakra-ui/react';
import { FiFolder, FiFile } from 'react-icons/fi';

// Import sub-components and hooks
import { useFileTreeLogic } from './FileTree/hooks/useFileTreeLogic';
import { useFileTreeUtils } from './FileTree/utils/fileTreeUtils';
import FileTreeContextMenu from './FileTree/components/FileTreeContextMenu';
import FileTreeMoveModal from './FileTree/components/FileTreeMoveModal';
import FileTreeNode from './FileTree/components/FileTreeNode';

const FileTree = ({
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
  projects = [],
  setNodes,
}) => {
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const selectedBg = useColorModeValue('blue.100', 'blue.800');

  // Custom hooks for logic and utilities
  const {
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
    renameInputRef,
    newItemInputRef,
    contextMenuRef,
    isMoveModalOpen,
    onMoveModalClose,
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
  } = useFileTreeLogic({
    nodes,
    rootId,
    projectId,
    setNodes,
    createFolder,
    createFile,
    renameNode,
    moveNode,
    duplicateNode,
  });

  const {
    getNodeIcon,
    getIconColor,
    getMoveDestinations,
    debugRootNode,
  } = useFileTreeUtils();

  useOutsideClick({
    ref: contextMenuRef,
    handler: () => setContextMenu({ ...contextMenu, isOpen: false }),
  });

  // Memoized renderNode function
  const renderNode = useCallback((nodeId, depth = 0) => {
    const node = nodes.find(n => n.id === nodeId);
    
    // Debug logging for root node (fixed to prevent infinite loops)
    if (nodeId === rootId && nodes.length > 0) {
      debugRootNode(nodeId, rootId, nodes, projectId);
    }
    
    if (!node) return null;
    
    // Skip rendering the hidden root folder but render its children
    if (node.hidden || node.name === '__PROJECT_ROOT__') {
      console.log('🌳 DEBUG: Processing hidden root:', node.name);
      
      const children = nodes.filter(n => 
        (n.parentId === nodeId || n.parent_id === nodeId) &&
        (n.project_id === projectId || n.projectId === projectId)
      );
      
      console.log(`🌳 DEBUG: Hidden root has ${children.length} children to render`);
      children.forEach(child => {
        console.log(`🌳 DEBUG: - Child: ${child.name} (${child.type}), hidden: ${child.hidden}`);
      });
      
      return (
        <Box key={nodeId}>
          {children
            .sort((a, b) => {
              if (a.type === 'folder' && b.type !== 'folder') return -1;
              if (a.type !== 'folder' && b.type === 'folder') return 1;
              return a.name.localeCompare(b.name);
            })
            .map(child => {
              console.log(`🌳 DEBUG: Rendering child: ${child.name}`);
              return renderNode(child.id, 0);
            })}
          
          {newItemParentId === nodeId && (
            <Box mt={1}>
              <Flex align="center">
                <Icon 
                  as={newItemType === 'folder' ? FiFolder : FiFile} 
                  mr={2} 
                  color={newItemType === 'folder' ? 'yellow.500' : 'blue.500'} 
                />
                <Input
                  size="xs"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onBlur={handleCreateNewItem}
                  onKeyDown={(e) => handleKeyDown(e, handleCreateNewItem, handleCancelNewItem)}
                  ref={newItemInputRef}
                  width="150px"
                />
              </Flex>
            </Box>
          )}
        </Box>
      );
    }
    
    const children = nodes.filter(n => 
      (n.parentId === nodeId || n.parent_id === nodeId) &&
      (n.project_id === projectId || n.projectId === projectId)
    );
    
    const isExpanded = expandedNodes.has(nodeId);
    const isSelected = selectedNode === nodeId;
    const isRenamingThis = renameId === nodeId;
    const isAddingNewItem = newItemParentId === nodeId;
    const iconColor = getIconColor(node);
    
    return (
      <Box key={nodeId}>
        <FileTreeNode
          node={node}
          depth={depth}
          isExpanded={isExpanded}
          isSelected={isSelected}
          isRenaming={isRenamingThis}
          renameError={renameError}
          newName={newName}
          setNewName={setNewName}
          iconColor={iconColor}
          selectedBg={selectedBg}
          hoverBg={hoverBg}
          getNodeIcon={getNodeIcon}
          toggleExpand={toggleExpand}
          setSelectedNode={setSelectedNode}
          handleContextMenu={handleContextMenu}
          handleRename={handleRename}
          handleCancelRename={handleCancelRename}
          handleKeyDown={handleKeyDown}
          renameInputRef={renameInputRef}
          handleStartNewItem={handleStartNewItem}
          handleStartRename={handleStartRename}
          handleStartMove={handleStartMove}
          handleDuplicate={handleDuplicate}
          confirmDelete={confirmDelete}
          isRenamingGlobal={isRenaming}
        />
        
        {isAddingNewItem && (
          <Box ml={depth > 0 ? 8 : 4} mt={1}>
            <Flex align="center">
              <Icon 
                as={newItemType === 'folder' ? FiFolder : FiFile} 
                mr={2} 
                color={newItemType === 'folder' ? 'yellow.500' : 'blue.500'} 
              />
              <Input
                size="xs"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onBlur={handleCreateNewItem}
                onKeyDown={(e) => handleKeyDown(e, handleCreateNewItem, handleCancelNewItem)}
                ref={newItemInputRef}
                width="150px"
                autoFocus
              />
            </Flex>
          </Box>
        )}
        
        {isExpanded && node.type === 'folder' && children.length > 0 && (
          <Box>
            {children.sort((a, b) => {
              if (a.type === 'folder' && b.type !== 'folder') return -1;
              if (a.type !== 'folder' && b.type === 'folder') return 1;
              return a.name.localeCompare(b.name);
            }).map(child => renderNode(child.id, depth + 1))}
          </Box>
        )}
      </Box>
    );
  }, [
    nodes, rootId, projectId, expandedNodes, selectedNode, renameId, newName, 
    renameError, isRenaming, newItemParentId, newItemType, newItemName, 
    getNodeIcon, getIconColor, selectedBg, hoverBg, handleContextMenu, 
    toggleExpand, setSelectedNode, handleStartNewItem, handleStartRename, 
    handleStartMove, handleDuplicate, confirmDelete, handleCreateNewItem, 
    handleKeyDown, handleCancelNewItem, handleRename, handleCancelRename, 
    debugRootNode, setNewName, setNewItemName, renameInputRef, newItemInputRef
  ]);

  return (
    <>
      {renderNode(rootId)}
      
      <FileTreeContextMenu
        contextMenu={contextMenu}
        contextMenuRef={contextMenuRef}
        nodes={nodes}
        isRenaming={isRenaming}
        handleStartNewItem={handleStartNewItem}
        handleStartRename={handleStartRename}
        handleStartMove={handleStartMove}
        handleDuplicate={handleDuplicate}
        confirmDelete={confirmDelete}
        setContextMenu={setContextMenu}
      />
      
      <FileTreeMoveModal
        isOpen={isMoveModalOpen}
        onClose={onMoveModalClose}
        nodeToMove={nodeToMove}
        getMoveDestinations={() => getMoveDestinations(nodeToMove, nodes, projectId, projects)}
        handleMoveToFolder={handleMoveToFolder}
      />
    </>
  );
};

export default FileTree;