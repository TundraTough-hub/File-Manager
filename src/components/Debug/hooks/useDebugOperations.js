// src/components/Debug/hooks/useDebugOperations.js
// Custom hook for debug operations like orphan detection and project fixes

import { useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { invoke } from '@tauri-apps/api/tauri';
import { appDir, join } from '@tauri-apps/api/path';

export const useDebugOperations = ({ projects, nodes, clients }) => {
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState(null);
  const toast = useToast();

  // Get app information from backend
  const getAppInfo = useCallback(async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      const appInfo = await invoke('get_app_info');
      setDebugInfo(appInfo);
      console.log('📊 Debug info loaded:', appInfo);
      return appInfo;
    } catch (error) {
      console.error('❌ Failed to get app info:', error);
      toast({
        title: 'Debug info failed',
        description: error.toString(),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loading, toast]);

  // Delete selected orphaned files
  const deleteOrphanedFiles = useCallback(async (selectedOrphanIds, orphanedFiles, currentProjectId) => {
    if (selectedOrphanIds.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select orphaned files to delete',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    try {
      setLoading(true);
      
      for (const orphanId of selectedOrphanIds) {
        const orphanFile = orphanedFiles.find(f => f.id === orphanId);
        if (orphanFile) {
          console.log('🗑️ FIXED: Deleting orphan with correct params:', {
            nodeId: orphanId,
            filePath: orphanFile.file_path || orphanFile.name || '',
            projectId: currentProjectId,
          });
          
          // FIXED: Use correct camelCase parameter names that match the Rust command
          const basePath = await appDir();
          const filePath = await join(basePath, orphanFile.file_path || orphanFile.name || '');

          await invoke('delete_node', {
            nodeId: orphanId,
            filePath,
            projectId: currentProjectId,
          });
        }
      }

      toast({
        title: 'Files deleted',
        description: `${selectedOrphanIds.length} orphaned files have been deleted`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      return true;
    } catch (error) {
      console.error('❌ FIXED: Failed to delete orphans:', error);
      toast({
        title: 'Delete failed',
        description: error.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [loading, toast]);

  // Delete unassigned orphaned files
  const deleteUnassignedOrphans = useCallback(async (selectedUnassignedIds, unassignedOrphanedFiles) => {
    if (selectedUnassignedIds.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select unassigned orphaned files to delete',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    try {
      setLoading(true);
      
      for (const orphanId of selectedUnassignedIds) {
        const orphanFile = unassignedOrphanedFiles.find(f => f.id === orphanId);
        if (orphanFile) {
          const basePath = await appDir();
          const filePath = await join(basePath, orphanFile.file_path || orphanFile.name || '');

          await invoke('delete_node', {
            nodeId: orphanId,
            filePath,
            projectId: null, // No project for unassigned files
          });
        }
      }

      toast({
        title: 'Files deleted',
        description: `${selectedUnassignedIds.length} unassigned orphaned files have been deleted`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      return true;
    } catch (error) {
      console.error('Failed to delete unassigned orphans:', error);
      toast({
        title: 'Delete failed',
        description: error.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [loading, toast]);

  // Rebuild project tree from disk
  const rebuildProjectTree = useCallback(async (currentProjectId) => {
    try {
      setLoading(true);
      
      // FIXED: Use correct camelCase parameter name
      const result = await invoke('rebuild_project_tree', {
        projectId: currentProjectId,
      });
      
      toast({
        title: 'Project rebuilt',
        description: `Project structure rebuilt with ${result.length} items`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      
      return result;
    } catch (error) {
      console.error('❌ FIXED: Failed to rebuild project:', error);
      toast({
        title: 'Rebuild failed',
        description: error.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loading, toast]);

  // Copy debug data to clipboard
  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied to clipboard',
        status: 'success',
        duration: 1000,
        isClosable: true,
      });
    }).catch(() => {
      toast({
        title: 'Failed to copy',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
    });
  }, [toast]);

  // Utility functions for orphan detection
  const findOrphanedFiles = useCallback((projectId) => {
    return nodes.filter(node => 
      (node.project_id === projectId || node.projectId === projectId) &&
      (node.parent_id === null || node.parent_id === undefined) &&
      !node.hidden &&
      node.name !== '__PROJECT_ROOT__'
    );
  }, [nodes]);

  const findUnassignedOrphanedFiles = useCallback(() => {
    return nodes.filter(node =>
      (!node.project_id && !node.projectId) &&
      (node.parent_id === null || node.parent_id === undefined) &&
      !node.hidden &&
      node.name !== '__PROJECT_ROOT__'
    );
  }, [nodes]);

  const findProjectRoot = useCallback((projectId) => {
    return nodes.find(node => 
      (node.project_id === projectId || node.projectId === projectId) &&
      (node.hidden === true || node.name === '__PROJECT_ROOT__')
    );
  }, [nodes]);

  const getAllOrphanedFiles = useCallback(() => {
    return nodes.filter(node => 
      (node.parent_id === null || node.parent_id === undefined) &&
      !node.hidden &&
      node.name !== '__PROJECT_ROOT__'
    );
  }, [nodes]);

  return {
    // State
    loading,
    debugInfo,
    setDebugInfo,
    
    // Main operations
    getAppInfo,
    deleteOrphanedFiles,
    deleteUnassignedOrphans,
    rebuildProjectTree,
    copyToClipboard,
    
    // Utility functions
    findOrphanedFiles,
    findUnassignedOrphanedFiles,
    findProjectRoot,
    getAllOrphanedFiles,
  };
};