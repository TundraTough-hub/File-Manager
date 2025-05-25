// src/components/FileSync/hooks/useFileSync.js - SIMPLIFIED: Main hook
import { useSyncCoordinator } from './useSyncCoordinator';
import { generateSyncSummary } from '../utils/syncUtils';

export const useFileSync = ({ 
  projectId, 
  onFilesSync, 
  nodes = [], 
  currentProject = null 
}) => {
  const {
    // State from coordinator
    syncing,
    rebuilding,
    error,
    lastSyncFiles,
    lastSyncType,
    isOperating,
    isSyncAvailable,
    
    // Actions from coordinator
    handleQuickSync,
    handleFullRebuild,
    clearResults,
  } = useSyncCoordinator({
    projectId,
    onFilesSync,
    onShowResults: null, // We'll handle this in the parent component
  });

  /**
   * Get sync summary for display
   */
  const getSyncSummary = () => {
    if (lastSyncFiles.length === 0) return null;
    return generateSyncSummary(lastSyncFiles, lastSyncType);
  };

  /**
   * Get current operation status
   */
  const getOperationStatus = () => {
    if (syncing) return 'syncing';
    if (rebuilding) return 'rebuilding';
    return 'idle';
  };

  /**
   * Validate sync parameters
   */
  const validateParams = () => {
    if (!projectId) {
      return { isValid: false, error: 'No project selected' };
    }
    return { isValid: true, error: null };
  };

  return {
    // State
    syncing,
    rebuilding,
    syncedFiles: lastSyncFiles, // Alias for backward compatibility
    syncType: lastSyncType,
    error,
    isOperating,
    isSyncAvailable,
    
    // Actions
    handleNormalSync: handleQuickSync, // Alias for backward compatibility
    handleFullRebuild,
    clearSyncResults: clearResults, // Alias for backward compatibility
    
    // Computed values
    getSyncSummary,
    getOperationStatus,
    validateParams,
  };
};