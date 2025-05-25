// src/components/FileSync/SyncControls.jsx
// Sync buttons and menu controls

import React from 'react';
import {
  HStack,
  Button,
  Text,
  VStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
} from '@chakra-ui/react';
import { 
  FiRefreshCw, 
  FiChevronDown,
  FiTool,
  FiSearch,
} from 'react-icons/fi';
import { getSyncDisplayText } from './utils/syncUtils';

const SyncControls = ({ 
  projectId, 
  syncing,
  rebuilding,
  onNormalSync,
  onFullRebuild,
  currentProject = null 
}) => {
  const isOperating = syncing || rebuilding;
  const operationType = syncing ? 'normal' : 'rebuild';
  const displayText = getSyncDisplayText(operationType, isOperating);

  const handleNormalSyncClick = async () => {
    if (isOperating) return;
    
    const result = await onNormalSync();
    // Result handling is done in the parent component
    return result;
  };

  const handleFullRebuildClick = async () => {
    if (isOperating) return;
    
    const result = await onFullRebuild();
    // Result handling is done in the parent component
    return result;
  };

  return (
    <HStack spacing={2}>
      <Menu>
        <MenuButton
          as={Button}
          rightIcon={<FiChevronDown />}
          leftIcon={<FiRefreshCw />}
          size="sm"
          colorScheme="purple"
          variant="outline"
          isLoading={isOperating}
          loadingText={displayText.buttonText}
          isDisabled={!projectId}
        >
          File Sync
        </MenuButton>
        <MenuList>
          <MenuItem 
            icon={<FiSearch />} 
            onClick={handleNormalSyncClick}
            isDisabled={isOperating}
          >
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" fontWeight="medium">Quick Sync</Text>
              <Text fontSize="xs" color="gray.500">
                Find new files created by Python scripts
              </Text>
            </VStack>
          </MenuItem>
          <MenuDivider />
          <MenuItem 
            icon={<FiTool />} 
            onClick={handleFullRebuildClick}
            isDisabled={isOperating}
          >
            <VStack align="start" spacing={0}>
              <Text fontSize="sm" fontWeight="medium">Full Rebuild</Text>
              <Text fontSize="xs" color="gray.500">
                Completely rebuild the file tree from disk
              </Text>
            </VStack>
          </MenuItem>
        </MenuList>
      </Menu>

      {/* Status indicator */}
      {!projectId && (
        <Text fontSize="xs" color="gray.500">
          Select a project to sync
        </Text>
      )}

      {projectId && currentProject && (
        <Text fontSize="xs" color="gray.600">
          {currentProject.name}
        </Text>
      )}

      {isOperating && (
        <Text fontSize="xs" color="blue.600">
          {displayText.description}
        </Text>
      )}
    </HStack>
  );
};

export default SyncControls;