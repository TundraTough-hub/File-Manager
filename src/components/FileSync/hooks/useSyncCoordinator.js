// src/components/FileSync/hooks/useSyncCoordinator.js - Results handling
import { useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { useSyncOperations } from './useSyncOperations';

export const useSyncCoordinator = ({ 
  projectId, 
  onFilesSync,
  onShowResults 
}) => {
  const toast = useToast();
  
  const {
    syncing,
    rebuilding,
    error,
    lastSyncFiles,
    lastSyncType,
    isOperating,
    performQuickSync,
    performFullRebuild,
    clearResults,
  } = useSyncOperations({ projectId });

  /**
   * Handle quick sync with proper result processing
   */
  const handleQuickSync = useCallback(async () => {
    try {
      const result = await performQuickSync();
      
      console.log('🔄 COORDINATOR: Processing quick sync result:', result);

      if (result.success && result.hasNewFiles) {
        // Notify parent to update the file tree
        if (onFilesSync) {
          console.log('🔄 COORDINATOR: Notifying parent of new files:', result.files);
          onFilesSync(result.files);
        }

        // Show success toast
        toast({
          title: 'Files synced successfully',
          description: `Found and imported ${result.files.length} new file(s)`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Show results modal if handler provided
        if (onShowResults) {
          onShowResults(result.files, 'quick');
        }

      } else if (result.success && !result.hasNewFiles) {
        toast({
          title: 'Sync completed',
          description: 'No new files found - project is already up to date',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }

      return result;

    } catch (error) {
      console.error('❌ COORDINATOR: Quick sync failed:', error);
      
      toast({
        title: 'Sync failed',
        description: error.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });

      return { success: false, error: error.toString() };
    }
  }, [performQuickSync, onFilesSync, onShowResults, toast]);

  /**
   * Handle full rebuild with proper result processing
   */
  const handleFullRebuild = useCallback(async () => {
    try {
      const result = await performFullRebuild();
      
      console.log('🔨 COORDINATOR: Processing rebuild result:', result);

      if (result.success && result.hasNewFiles) {
        // Notify parent to update the file tree - IMPORTANT: This replaces all nodes
        if (onFilesSync) {
          console.log('🔨 COORDINATOR: Notifying parent of rebuilt files:', result.files);
          // For rebuild, we need to signal that this is a complete replacement
          onFilesSync(result.files, { isFullRebuild: true });
        }

        toast({
          title: 'Project tree rebuilt successfully',
          description: `Rebuilt project with ${result.files.length} file(s) and folder(s)`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        // Show results modal if handler provided
        if (onShowResults) {
          onShowResults(result.files, 'rebuild');
        }

      } else if (result.success && !result.hasNewFiles) {
        toast({
          title: 'Rebuild completed',
          description: 'Project tree rebuilt (no files found)',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }

      return result;

    } catch (error) {
      console.error('❌ COORDINATOR: Rebuild failed:', error);
      
      toast({
        title: 'Rebuild failed',
        description: error.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });

      return { success: false, error: error.toString() };
    }
  }, [performFullRebuild, onFilesSync, onShowResults, toast]);

  return {
    // State
    syncing,
    rebuilding,
    error,
    lastSyncFiles,
    lastSyncType,
    isOperating,
    isSyncAvailable: Boolean(projectId),
    
    // Actions
    handleQuickSync,
    handleFullRebuild,
    clearResults,
  };
};