// src/components/FileTree/components/FileTreeNode.jsx
import React from 'react';
import {
  Box,
  Flex,
  Text,
  Icon,
  Input,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from '@chakra-ui/react';
import { 
  FiFolder, 
  FiFile, 
  FiChevronRight, 
  FiChevronDown, 
  FiMoreVertical,
  FiPlus,
  FiEdit,
  FiMove,
  FiCopy,
  FiTrash2,
} from 'react-icons/fi';

const FileTreeNode = ({
  node,
  depth,
  isExpanded,
  isSelected,
  isRenaming,
  renameError,
  newName,
  setNewName,
  iconColor,
  selectedBg,
  hoverBg,
  getNodeIcon,
  toggleExpand,
  setSelectedNode,
  handleContextMenu,
  handleRename,
  handleCancelRename,
  handleKeyDown,
  renameInputRef,
  handleStartNewItem,
  handleStartRename,
  handleStartMove,
  handleDuplicate,
  confirmDelete,
  isRenamingGlobal,
}) => {
  return (
    <Box ml={depth > 0 ? 4 : 0} mt={1}>
      <Flex 
        align="center" 
        py={1}
        px={2}
        borderRadius="md"
        bg={isSelected ? selectedBg : 'transparent'}
        _hover={{ bg: isSelected ? selectedBg : hoverBg }}
        cursor="pointer"
        position="relative"
        onContextMenu={(e) => handleContextMenu(e, node.id)}
        role="group"
      >
        {node.type === 'folder' && (
          <Icon
            as={isExpanded ? FiChevronDown : FiChevronRight}
            mr={1}
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(node.id);
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
            onClick={() => setSelectedNode(node.id)}
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
                  onClick={() => handleStartNewItem(node.id, 'folder')}
                >
                  New Folder
                </MenuItem>
                <MenuItem 
                  icon={<FiPlus />}
                  onClick={() => handleStartNewItem(node.id, 'file')}
                >
                  New File
                </MenuItem>
              </>
            )}
            <MenuItem 
              icon={<FiEdit />}
              onClick={() => handleStartRename(node)}
              isDisabled={isRenamingGlobal}
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
              onClick={() => confirmDelete(node.id)}
              color="red.500"
            >
              Delete
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    </Box>
  );
};

export default FileTreeNode;