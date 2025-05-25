// src/components/FileSync/hooks/useSyncOperations.js - Core sync logic
import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export const useSyncOperations = ({ projectId }) => {
  const [operationState, setOperationState] = useState({
    syncing: false,
    rebuilding: false,
    error: null,
    lastSyncFiles: [],
    lastSyncType: null
  });

  /**
   * Perform quick sync - find new files created by scripts
   */
  const performQuickSync = useCallback(async () => {
    if (!projectId) {
      throw new Error('No project selected');
    }

    console.log('🔄 SYNC: Starting quick sync for project:', projectId);
    
    setOperationState(prev => ({ 
      ...prev, 
      syncing: true, 
      error: null 
    }));

    try {
      const newFiles = await invoke('sync_external_files', {
        projectId,
      });

      console.log('✅ SYNC: Quick sync completed, found files:', newFiles);
      
      setOperationState(prev => ({
        ...prev,
        syncing: false,
        lastSyncFiles: newFiles,
        lastSyncType: 'quick'
      }));

      return {
        success: true,
        files: newFiles,
        type: 'quick',
        hasNewFiles: newFiles.length > 0
      };

    } catch (error) {
      console.error('❌ SYNC: Quick sync failed:', error);
      const errorMessage = error.toString();
      
      setOperationState(prev => ({
        ...prev,
        syncing: false,
        error: errorMessage
      }));

      throw error;
    }
  }, [projectId]);

  /**
   * Perform full rebuild - rebuild entire project tree
   */
  const performFullRebuild = useCallback(async () => {
    if (!projectId) {
      throw new Error('No project selected');
    }

    console.log('🔨 SYNC: Starting full rebuild for project:', projectId);
    
    setOperationState(prev => ({ 
      ...prev, 
      rebuilding: true, 
      error: null 
    }));

    try {
      const allFiles = await invoke('rebuild_project_tree', {
        projectId,
      });

      console.log('✅ SYNC: Full rebuild completed, all files:', allFiles);
      
      setOperationState(prev => ({
        ...prev,
        rebuilding: false,
        lastSyncFiles: allFiles,
        lastSyncType: 'rebuild'
      }));

      return {
        success: true,
        files: allFiles,
        type: 'rebuild',
        hasNewFiles: allFiles.length > 0
      };

    } catch (error) {
      console.error('❌ SYNC: Full rebuild failed:', error);
      const errorMessage = error.toString();
      
      setOperationState(prev => ({
        ...prev,
        rebuilding: false,
        error: errorMessage
      }));

      throw error;
    }
  }, [projectId]);

  /**
   * Clear operation results
   */
  const clearResults = useCallback(() => {
    setOperationState(prev => ({
      ...prev,
      error: null,
      lastSyncFiles: [],
      lastSyncType: null
    }));
  }, []);

  /**
   * Check if any operation is running
   */
  const isOperating = operationState.syncing || operationState.rebuilding;

  return {
    // State
    ...operationState,
    isOperating,
    
    // Operations
    performQuickSync,
    performFullRebuild,
    clearResults,
  };
};