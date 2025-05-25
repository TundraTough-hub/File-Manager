// src/components/FileSyncButton.jsx - FIXED: Better result handling
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
   * Handle normal sync and show results if there are new files
   */
  const handleNormalSyncWithModal = async () => {
    console.log('🔄 BUTTON: Starting normal sync...');
    
    const result = await handleNormalSync();
    
    console.log('🔄 BUTTON: Sync result:', result);
    
    // Show modal only if we found new files
    if (result.success && result.files && result.files.length > 0) {
      console.log('🔄 BUTTON: Opening results modal for', result.files.length, 'files');
      onOpen();
    }
    
    return result;
  };

  /**
   * Handle full rebuild and show results if there are files
   */
  const handleFullRebuildWithModal = async () => {
    console.log('🔨 BUTTON: Starting full rebuild...');
    
    const result = await handleFullRebuild();
    
    console.log('🔨 BUTTON: Rebuild result:', result);
    
    // Show modal only if we found files
    if (result.success && result.files && result.files.length > 0) {
      console.log('🔨 BUTTON: Opening results modal for', result.files.length, 'files');
      onOpen();
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

  console.log('🔄 BUTTON: Current state:', {
    projectId,
    syncing,
    rebuilding,
    syncedFilesCount: syncedFiles?.length || 0,
    syncType,
    hasError: !!error
  });

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
        syncedFiles={syncedFiles || []}
        syncType={syncType || 'normal'}
        summary={syncSummary}
      />
    </>
  );
};

export default FileSyncButton;