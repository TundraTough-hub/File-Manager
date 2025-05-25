// src/components/FileSyncButton.jsx
// Main file sync component - orchestrates sync operations

import React from 'react';
import { useDisclosure } from '@chakra-ui/react';
import SyncControls from './FileSync/SyncControls';
import SyncResultsModal from './FileSync/SyncResultsModal';
import { useFileSync } from './FileSync/hooks/useFileSync';

const FileSyncButton = ({ 
  projectId, 
  onFilesSync, 
  nodes = [], 
  currentProject = null 
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const {
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
  } = useFileSync({
    projectId,
    onFilesSync,
    nodes,
    currentProject,
  });

  /**
   * Handle normal sync and show results
   */
  const handleNormalSyncWithModal = async () => {
    const result = await handleNormalSync();
    
    if (result.success && result.hasNewFiles) {
      onOpen(); // Show results modal
    }
    
    return result;
  };

  /**
   * Handle full rebuild and show results
   */
  const handleFullRebuildWithModal = async () => {
    const result = await handleFullRebuild();
    
    if (result.success && result.hasNewFiles) {
      onOpen(); // Show results modal
    }
    
    return result;
  };

  /**
   * Handle modal close and cleanup
   */
  const handleModalClose = () => {
    onClose();
    // Optional: Clear results after modal is closed
    // clearSyncResults();
  };

  const syncSummary = getSyncSummary();

  return (
    <>
      {/* Sync Controls */}
      <SyncControls
        projectId={projectId}
        syncing={syncing}
        rebuilding={rebuilding}
        onNormalSync={handleNormalSyncWithModal}
        onFullRebuild={handleFullRebuildWithModal}
        currentProject={currentProject}
      />

      {/* Sync Results Modal */}
      <SyncResultsModal
        isOpen={isOpen}
        onClose={handleModalClose}
        syncedFiles={syncedFiles}
        syncType={syncType}
        summary={syncSummary}
      />
    </>
  );
};

export default FileSyncButton;