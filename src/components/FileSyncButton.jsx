// src/components/FileSyncButton.jsx - Enhanced with rebuild functionality
import React, { useState } from 'react';
import {
  Button,
  HStack,
  Text,
  useToast,
  Tooltip,
  Badge,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  List,
  ListItem,
  ListIcon,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
} from '@chakra-ui/react';
import { 
  FiRefreshCw, 
  FiFile, 
  FiFolder, 
  FiCheck,
  FiAlertTriangle,
  FiChevronDown,
  FiTool,
  FiSearch,
} from 'react-icons/fi';
import { invoke } from '@tauri-apps/api/tauri';

const FileSyncButton = ({ 
  projectId, 
  onFilesSync, 
  nodes = [], 
  currentProject = null 
}) => {
  const [syncing, setSyncing] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [syncedFiles, setSyncedFiles] = useState([]);
  const [syncType, setSyncType] = useState('normal'); // 'normal' or 'rebuild'
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const handleNormalSync = async () => {
    if (!projectId) {
      toast({
        title: 'No project selected',
        description: 'Please select a project to sync files',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setSyncing(true);
      setSyncType('normal');
      console.log('🔄 Starting normal file sync for project:', projectId);

      // Call the backend sync command
      const newFiles = await invoke('sync_external_files', {
        projectId,
      });

      console.log('✅ Normal sync completed, new files:', newFiles);
      setSyncedFiles(newFiles);

      if (newFiles.length > 0) {
        // Notify parent component to refresh the file tree
        if (onFilesSync) {
          onFilesSync(newFiles);
        }

        // Show success message and open details modal
        toast({
          title: 'Files synced successfully',
          description: `Found and imported ${newFiles.length} new file(s)`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        onOpen(); // Show the sync results modal
      } else {
        toast({
          title: 'Sync completed',
          description: 'No new files found - project is already up to date',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }

    } catch (error) {
      console.error('❌ Normal sync failed:', error);
      toast({
        title: 'Sync failed',
        description: error.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleFullRebuild = async () => {
    if (!projectId) {
      toast({
        title: 'No project selected',
        description: 'Please select a project to rebuild',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setRebuilding(true);
      setSyncType('rebuild');
      console.log('🔨 Starting full rebuild for project:', projectId);

      // Call the backend rebuild command
      const allFiles = await invoke('rebuild_project_tree', {
        projectId,
      });

      console.log('✅ Full rebuild completed, all files:', allFiles);
      setSyncedFiles(allFiles);

      if (allFiles.length > 0) {
        // Notify parent component to refresh the file tree
        if (onFilesSync) {
          onFilesSync(allFiles);
        }

        // Show success message and open details modal
        toast({
          title: 'Project tree rebuilt successfully',
          description: `Rebuilt project with ${allFiles.length} file(s) and folder(s)`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        onOpen(); // Show the sync results modal
      } else {
        toast({
          title: 'Rebuild completed',
          description: 'Project tree rebuilt (no files found)',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }

    } catch (error) {
      console.error('❌ Full rebuild failed:', error);
      toast({
        title: 'Rebuild failed',
        description: error.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setRebuilding(false);
    }
  };

  const getFileIcon = (node) => {
    if (node.type === 'folder') return FiFolder;
    return FiFile;
  };

  const getFileIconColor = (node) => {
    if (node.type === 'folder') return 'yellow.500';
    
    const ext = node.extension?.toLowerCase();
    if (ext === 'py') return 'blue.500';
    if (ext === 'json') return 'green.500';
    if (ext === 'csv') return 'green.600';
    if (ext === 'txt') return 'gray.600';
    
    return 'blue.500';
  };

  const isOperating = syncing || rebuilding;

  return (
    <>
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
            loadingText={syncing ? "Syncing" : "Rebuilding"}
            isDisabled={!projectId}
          >
            File Sync
          </MenuButton>
          <MenuList>
            <MenuItem 
              icon={<FiSearch />} 
              onClick={handleNormalSync}
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
              onClick={handleFullRebuild}
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

        {!projectId && (
          <Text fontSize="xs" color="gray.500">
            Select a project to sync
          </Text>
        )}
      </HStack>

      {/* Sync Results Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack>
              <Icon as={FiCheck} color="green.500" />
              <Text>
                {syncType === 'rebuild' ? 'Project Tree Rebuilt' : 'Files Synced Successfully'}
              </Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {syncedFiles.length > 0 ? (
              <VStack spacing={4} align="stretch">
                <Alert status="success">
                  <AlertIcon />
                  <AlertTitle>
                    {syncType === 'rebuild' ? 'Rebuild Complete!' : 'Sync Complete!'}
                  </AlertTitle>
                  <AlertDescription>
                    {syncType === 'rebuild' 
                      ? `Rebuilt project tree with ${syncedFiles.length} file(s) and folder(s).`
                      : `Found and imported ${syncedFiles.length} new file(s) created by your Python scripts.`
                    }
                  </AlertDescription>
                </Alert>

                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="medium">
                    {syncType === 'rebuild' ? 'Project Contents:' : 'New Files Added:'}
                  </Text>
                  <List spacing={2} maxH="300px" overflowY="auto">
                    {syncedFiles.map((file) => (
                      <ListItem key={file.id} p={2} borderRadius="md" bg="gray.50" _dark={{ bg: "gray.700" }}>
                        <HStack spacing={3}>
                          <ListIcon 
                            as={getFileIcon(file)} 
                            color={getFileIconColor(file)}
                          />
                          <VStack align="start" spacing={0} flex="1">
                            <Text fontSize="sm" fontWeight="medium">
                              {file.name}
                            </Text>
                            <HStack spacing={2}>
                              <Badge size="sm" colorScheme="blue">
                                {file.type}
                              </Badge>
                              {file.extension && (
                                <Badge size="sm" variant="outline">
                                  .{file.extension}
                                </Badge>
                              )}
                              {file.size && (
                                <Text fontSize="xs" color="gray.500">
                                  {formatFileSize(file.size)}
                                </Text>
                              )}
                              {file.file_path && (
                                <Text fontSize="xs" color="gray.500" isTruncated maxW="200px">
                                  {file.file_path}
                                </Text>
                              )}
                            </HStack>
                          </VStack>
                        </HStack>
                      </ListItem>
                    ))}
                  </List>
                </VStack>

                <Alert status="info" size="sm">
                  <AlertIcon />
                  <Text fontSize="sm">
                    {syncType === 'rebuild' 
                      ? 'The project file tree has been completely rebuilt from disk.'
                      : 'These files are now part of your project and will appear in the file tree.'
                    }
                  </Text>
                </Alert>
              </VStack>
            ) : (
              <Alert status="info">
                <AlertIcon />
                <AlertTitle>
                  {syncType === 'rebuild' ? 'Rebuild Complete' : 'No New Files'}
                </AlertTitle>
                <AlertDescription>
                  {syncType === 'rebuild' 
                    ? 'The project tree has been rebuilt but no files were found.'
                    : 'Your project is already up to date. No new files were found.'
                  }
                </AlertDescription>
              </Alert>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

// Helper function to format file sizes
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default FileSyncButton;