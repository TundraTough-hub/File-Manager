// src/components/FileSync/hooks/useFileSync.js
// Custom hook for file sync operations

import { useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { invoke } from '@tauri-apps/api/tauri';
import { validateSyncParams, generateSyncSummary } from '../utils/syncUtils';

export const useFileSync = ({ 
  projectId, 
  onFilesSync, 
  nodes = [], 
  currentProject = null 
}) => {
  const [syncing, setSyncing] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [syncedFiles, setSyncedFiles] = useState([]);
  const [syncType, setSyncType] = useState('normal'); // 'normal' or 'rebuild'
  const [error, setError] = useState(null);
  
  const toast = useToast();

  /**
   * Perform normal sync operation
   */
  const performNormalSync = async () => {
    const validation = validateSyncParams(projectId);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    console.log('🔄 Starting normal file sync for project:', projectId);

    // Call the backend sync command
    const newFiles = await invoke('sync_external_files', {
      projectId,
    });

    console.log('✅ Normal sync completed, new files:', newFiles);
    return newFiles;
  };

  /**
   * Perform full rebuild operation
   */
  const performFullRebuild = async () => {
    const validation = validateSyncParams(projectId);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    console.log('🔨 Starting full rebuild for project:', projectId);

    // Call the backend rebuild command
    const allFiles = await invoke('rebuild_project_tree', {
      projectId,
    });

    console.log('✅ Full rebuild completed, all files:', allFiles);
    return allFiles;
  };

  /**
   * Handle normal sync operation
   */
  const handleNormalSync = async () => {
    try {
      setSyncing(true);
      setSyncType('normal');
      setError(null);

      const newFiles = await performNormalSync();
      setSyncedFiles(newFiles);

      if (newFiles.length > 0) {
        // Notify parent component to refresh the file tree
        if (onFilesSync) {
          onFilesSync(newFiles);
        }

        toast({
          title: 'Files synced successfully',
          description: `Found and imported ${newFiles.length} new file(s)`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        return { success: true, files: newFiles, hasNewFiles: true };
      } else {
        toast({
          title: 'Sync completed',
          description: 'No new files found - project is already up to date',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });

        return { success: true, files: [], hasNewFiles: false };
      }

    } catch (error) {
      console.error('❌ Normal sync failed:', error);
      const errorMessage = error.toString();
      setError(errorMessage);
      
      toast({
        title: 'Sync failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });

      return { success: false, error: errorMessage };
    } finally {
      setSyncing(false);
    }
  };

  /**
   * Handle full rebuild operation
   */
  const handleFullRebuild = async () => {
    try {
      setRebuilding(true);
      setSyncType('rebuild');
      setError(null);

      const allFiles = await performFullRebuild();
      setSyncedFiles(allFiles);

      if (allFiles.length > 0) {
        // Notify parent component to refresh the file tree
        if (onFilesSync) {
          onFilesSync(allFiles);
        }

        toast({
          title: 'Project tree rebuilt successfully',
          description: `Rebuilt project with ${allFiles.length} file(s) and folder(s)`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        return { success: true, files: allFiles, hasNewFiles: true };
      } else {
        toast({
          title: 'Rebuild completed',
          description: 'Project tree rebuilt (no files found)',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });

        return { success: true, files: [], hasNewFiles: false };
      }

    } catch (error) {
      console.error('❌ Full rebuild failed:', error);
      const errorMessage = error.toString();
      setError(errorMessage);
      
      toast({
        title: 'Rebuild failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });

      return { success: false, error: errorMessage };
    } finally {
      setRebuilding(false);
    }
  };

  /**
   * Clear sync results
   */
  const clearSyncResults = () => {
    setSyncedFiles([]);
    setError(null);
    setSyncType('normal');
  };

  /**
   * Get sync summary for display
   */
  const getSyncSummary = () => {
    if (syncedFiles.length === 0) return null;
    return generateSyncSummary(syncedFiles, syncType);
  };

  /**
   * Check if any operation is currently running
   */
  const isOperating = syncing || rebuilding;

  /**
   * Check if sync is available (project selected)
   */
  const isSyncAvailable = Boolean(projectId);

  /**
   * Get current operation status
   */
  const getOperationStatus = () => {
    if (syncing) return 'syncing';
    if (rebuilding) return 'rebuilding';
    return 'idle';
  };

  return {
    // State
    syncing,
    rebuilding,
    syncedFiles,
    syncType,
    error,
    isOperating,
    isSyncAvailable,
    
    // Actions
    handleNormalSync,
    handleFullRebuild,
    clearSyncResults,
    
    // Computed values
    getSyncSummary,
    getOperationStatus,
    
    // Validation
    validateParams: () => validateSyncParams(projectId),
  };
};