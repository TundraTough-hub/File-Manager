// src/components/FileTree.jsx - Enhanced with better rename handling and duplicate prevention
import { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  Icon, 
  Menu, 
  MenuButton, 
  MenuList, 
  MenuItem,
  Input,
  IconButton,
  useColorModeValue,
  useOutsideClick,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { 
  FiFolder, 
  FiFile, 
  FiChevronRight, 
  FiChevronDown, 
  FiMoreVertical,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiCode,
  FiFileText,
  FiBook,
  FiDatabase,
  FiImage,
  FiGlobe,
  FiGrid,
  FiMove,
  FiCopy,
} from 'react-icons/fi';

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
  
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const selectedBg = useColorModeValue('blue.100', 'blue.800');
  
  const { 
    isOpen: isMoveModalOpen, 
    onOpen: onMoveModalOpen, 
    onClose: onMoveModalClose 
  } = useDisclosure();
  
  useOutsideClick({
    ref: contextMenuRef,
    handler: () => setContextMenu({ ...contextMenu, isOpen: false }),
  });

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

  // Enhanced auto-rename handling with duplicate prevention
  useEffect(() => {
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
      
      // Clear the shouldRename flag immediately to prevent duplicates
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

  const getNodeIcon = (node) => {
    if (node.type === 'folder') {
      return FiFolder;
    }
    
    if (node.extension) {
      const ext = node.extension.toLowerCase();
      if (ext === 'py') return FiCode;
      if (ext === 'ipynb') return FiBook;
      if (ext === 'txt' || ext === 'md') return FiFileText;
      if (ext === 'json' || ext === 'csv') return FiDatabase;
      if (['jpg', 'png', 'gif', 'svg'].includes(ext)) return FiImage;
      if (['html', 'css', 'js'].includes(ext)) return FiGlobe;
      if (['xlsx', 'xls'].includes(ext)) return FiGrid;
    }
    
    return FiFile;
  };
  
  const getIconColor = (node) => {
    if (node.type === 'folder') {
      return 'yellow.500';
    }
    
    if (node.extension) {
      const ext = node.extension.toLowerCase();
      if (ext === 'py') return 'blue.500';
      if (ext === 'ipynb') return 'purple.500';
      if (['jpg', 'png', 'gif', 'svg'].includes(ext)) return 'pink.500';
      if (['html', 'css', 'js'].includes(ext)) return 'orange.500';
      if (['json', 'csv'].includes(ext)) return 'green.500';
    }
    
    return 'blue.500';
  };
  
  const toggleExpand = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };
  
  const handleStartRename = (node) => {
    if (isRenaming) {
      console.log('⚠️ Rename already in progress, ignoring');
      return;
    }
    
    setRenameId(node.id);
    setNewName(node.name);
    setRenameError('');
    setIsRenaming(true);
  };
  
  const handleRename = async () => {
    if (!newName.trim() || !renameId) {
      setRenameError('Name cannot be empty');
      return;
    }
    
    try {
      setRenameError('');
      await renameNode(renameId, newName.trim());
      setRenameId(null);
      setIsRenaming(false);
      
      // Clean up processed renames after successful rename
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
  };

  const handleCancelRename = () => {
    setRenameId(null);
    setRenameError('');
    setIsRenaming(false);
    
    if (renameId) {
      processedRenames.current.delete(renameId);
    }
  };
  
  const handleStartNewItem = (parentId, type) => {
    setNewItemParentId(parentId);
    setNewItemType(type);
    setNewItemName(type === 'folder' ? 'New Folder' : 'New File.txt');
  };
  
  const handleCreateNewItem = async () => {
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
        setExpandedNodes(new Set([...expandedNodes, newItemParentId]));
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
  };

  const handleCancelNewItem = () => {
    setNewItemParentId(null);
    setNewItemType(null);
  };
  
  const handleStartMove = (node) => {
    setNodeToMove(node);
    onMoveModalOpen();
  };
  
  const handleMoveToFolder = async (targetFolderId, targetProjectId) => {
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
  };
  
  const handleDuplicate = async (node) => {
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
  };
  
  const handleContextMenu = (e, nodeId) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      nodeId
    });
  };
  
  const handleKeyDown = (e, callback, cancelCallback = null) => {
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
  };
  
  const renderNode = (nodeId, depth = 0) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;
    
    // Skip rendering the hidden root folder but render its children
    if (node.hidden || node.name === '__PROJECT_ROOT__') {
      const children = nodes.filter(n => 
        n.parentId === nodeId || n.parent_id === nodeId
      );
      
      return (
        <Box key={nodeId}>
          {children.sort((a, b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return a.name.localeCompare(b.name);
          }).map(child => renderNode(child.id, 0))}
          
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
      n.parentId === nodeId || n.parent_id === nodeId
    );
    
    const isExpanded = expandedNodes.has(nodeId);
    const isSelected = selectedNode === nodeId;
    const isRenaming = renameId === nodeId;
    const isAddingNewItem = newItemParentId === nodeId;
    
    const iconColor = getIconColor(node);
    
    return (
      <Box key={nodeId} ml={depth > 0 ? 4 : 0} mt={1}>
        <Flex 
          align="center" 
          py={1}
          px={2}
          borderRadius="md"
          bg={isSelected ? selectedBg : 'transparent'}
          _hover={{ bg: isSelected ? selectedBg : hoverBg }}
          cursor="pointer"
          position="relative"
          onContextMenu={(e) => handleContextMenu(e, nodeId)}
          role="group"
        >
          {node.type === 'folder' && (
            <Icon
              as={isExpanded ? FiChevronDown : FiChevronRight}
              mr={1}
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(nodeId);
              }}
              cursor="pointer"
              color="gray.500"
              _hover={{ color: 'gray.700' }}
            />
          )}
          
          <Icon as={getNodeIcon(node)} mr={2} color={iconColor} />
          
          {isRenaming ? (
            <Box flex="1">
              <Input
                size="xs"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setRenameError('');
                }}
                onBlur={() => {
                  if (!renameError) {
                    handleRename();
                  }
                }}
                onKeyDown={(e) => handleKeyDown(e, handleRename, handleCancelRename)}
                ref={renameInputRef}
                width="150px"
                isInvalid={!!renameError}
                borderColor={renameError ? 'red.500' : undefined}
                autoFocus
              />
              {renameError && (
                <Text fontSize="xs" color="red.500" mt={1}>
                  {renameError}
                </Text>
              )}
            </Box>
          ) : (
            <Text
              flex="1"
              onClick={() => setSelectedNode(nodeId)}
              isTruncated
              fontWeight={isSelected ? "medium" : "normal"}
              color={isSelected ? "blue.600" : "inherit"}
              _dark={{
                color: isSelected ? "blue.300" : "inherit"
              }}
            >
              {node.name}
            </Text>
          )}
          
          <Menu>
            <MenuButton
              as={IconButton}
              icon={<FiMoreVertical />}
              variant="ghost"
              size="xs"
              onClick={(e) => e.stopPropagation()}
              opacity="0"
              _groupHover={{ opacity: 1 }}
              transition="opacity 0.2s"
            />
            <MenuList minW="150px" fontSize="sm">
              {node.type === 'folder' && (
                <>
                  <MenuItem 
                    icon={<FiPlus />}
                    onClick={() => handleStartNewItem(nodeId, 'folder')}
                  >
                    New Folder
                  </MenuItem>
                  <MenuItem 
                    icon={<FiPlus />}
                    onClick={() => handleStartNewItem(nodeId, 'file')}
                  >
                    New File
                  </MenuItem>
                </>
              )}
              <MenuItem 
                icon={<FiEdit />}
                onClick={() => handleStartRename(node)}
                isDisabled={isRenaming}
              >
                Rename
              </MenuItem>
              <MenuItem 
                icon={<FiMove />}
                onClick={() => handleStartMove(node)}
              >
                Move
              </MenuItem>
              <MenuItem 
                icon={<FiCopy />}
                onClick={() => handleDuplicate(node)}
              >
                Duplicate
              </MenuItem>
              <MenuItem 
                icon={<FiTrash2 />}
                onClick={() => confirmDelete(nodeId)}
                color="red.500"
              >
                Delete
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
        
        {isAddingNewItem && (
          <Box ml={4} mt={1}>
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
  };
  
  const getMoveDestinations = () => {
    const destinations = [];
    
    if (!nodeToMove) {
      return destinations;
    }
    
    // Get visible folders in current project (excluding the item being moved)
    const projectFolders = nodes.filter(n => 
      n.type === 'folder' && 
      (n.project_id === projectId || n.projectId === projectId) &&
      n.id !== nodeToMove.id &&
      !n.hidden &&
      n.name !== '__PROJECT_ROOT__'
    );
    
    // Find the hidden root for this project
    const hiddenRoot = nodes.find(n => 
      (n.name === '__PROJECT_ROOT__' || n.hidden) && 
      (n.project_id === projectId || n.projectId === projectId)
    );
    
    // Get current project name
    const currentProject = projects.find(p => p.id === projectId);
    
    // Add current project root level
    if (hiddenRoot && currentProject) {
      destinations.push({
        id: hiddenRoot.id,
        name: `📋 ${currentProject.name}`,
        projectId: projectId,
        projectName: 'Current Project',
        isProjectRoot: true
      });
    }
    
    // Add visible folders in current project
    projectFolders.forEach(folder => {
      destinations.push({
        id: folder.id,
        name: `📁 ${folder.name}`,
        projectId: projectId,
        projectName: 'Current Project',
        isProjectRoot: false
      });
    });
    
    // Add other projects
    projects.forEach(project => {
      if (project.id !== projectId) {
        const otherProjectRoot = nodes.find(n => 
          (n.name === '__PROJECT_ROOT__' || n.hidden) && 
          (n.project_id === project.id || n.projectId === project.id)
        );
        
        // Add other project root level
        if (otherProjectRoot) {
          destinations.push({
            id: otherProjectRoot.id,
            name: `📋 ${project.name}`,
            projectId: project.id,
            projectName: project.name,
            isProjectRoot: true
          });
        }
        
        // Add visible folders from other projects
        const otherProjectFolders = nodes.filter(n => 
          n.type === 'folder' && 
          (n.project_id === project.id || n.projectId === project.id) &&
          !n.hidden &&
          n.name !== '__PROJECT_ROOT__'
        );
        
        otherProjectFolders.forEach(folder => {
          destinations.push({
            id: folder.id,
            name: `📁 ${folder.name}`,
            projectId: project.id,
            projectName: project.name,
            isProjectRoot: false
          });
        });
      }
    });
    
    return destinations;
  };
  
  return (
    <>
      {renderNode(rootId)}
      
      {/* Enhanced Context Menu */}
      {contextMenu.isOpen && (
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
          {contextMenu.nodeId && (() => {
            const node = nodes.find(n => n.id === contextMenu.nodeId);
            if (!node) return null;
            
            return (
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
                        setContextMenu({ ...contextMenu, isOpen: false });
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
                        setContextMenu({ ...contextMenu, isOpen: false });
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
                    setContextMenu({ ...contextMenu, isOpen: false });
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
                    setContextMenu({ ...contextMenu, isOpen: false });
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
                    setContextMenu({ ...contextMenu, isOpen: false });
                  }}
                  fontSize="sm"
                  display="flex"
                  alignItems="center"
                >
                  <Icon as={FiCopy} mr={2} />
                  Duplicate
                </Box>
                <Box
                  px={3}
                  py={2}
                  cursor="pointer"
                  _hover={{ bg: 'red.100', _dark: { bg: 'red.900' } }}
                  onClick={() => {
                    confirmDelete(contextMenu.nodeId);
                    setContextMenu({ ...contextMenu, isOpen: false });
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
            );
          })()}
        </Box>
      )}
      
      {/* Enhanced Move Modal */}
      {nodeToMove && (
        <Modal isOpen={isMoveModalOpen} onClose={onMoveModalClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Move "{nodeToMove.name}"</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={2} align="stretch" maxH="300px" overflowY="auto">
                <Text fontSize="sm" color="gray.600" mb={2}>
                  Choose destination:
                </Text>
                
                {getMoveDestinations().map((destination, index) => (
                  <Button
                    key={`${destination.projectId}-${destination.id}-${index}`}
                    variant="outline"
                    justifyContent="flex-start"
                    onClick={() => handleMoveToFolder(destination.id, destination.projectId)}
                    size="sm"
                    leftIcon={
                      <Icon 
                        as={destination.isProjectRoot ? FiFolder : FiFolder} 
                        color={destination.isProjectRoot ? "blue.500" : "yellow.500"} 
                      />
                    }
                  >
                    <Box textAlign="left" flex="1">
                      <Text fontSize="sm">{destination.name}</Text>
                      {destination.projectName !== 'Current Project' && (
                        <Text fontSize="xs" color="gray.500">
                          in {destination.projectName}
                        </Text>
                      )}
                    </Box>
                  </Button>
                ))}
                
                {getMoveDestinations().length === 0 && (
                  <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                    No available destinations
                  </Text>
                )}
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" onClick={onMoveModalClose}>
                Cancel
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

export default FileTree;