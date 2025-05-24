// src/hooks/useAppOperations.js
// Main coordinator hook that orchestrates all operations

import { useProjectOperations } from './operations/useProjectOperations';
import { useFileOperations } from './operations/useFileOperations';
import { useNodeOperations } from './operations/useNodeOperations';
import { useBulkOperations } from './operations/useBulkOperations';

export const useAppOperations = ({
  projects,
  nodes,
  clients,
  setProjects,
  setNodes,
  setClients,
  setSelectedNode,
  pendingOperationsRef,
}) => {
  
  // Project operations
  const {
    createProject,
    renameProject,
    moveProject,
    duplicateProject,
    deleteProject,
  } = useProjectOperations({
    projects,
    nodes,
    clients,
    setProjects,
    setNodes,
    setClients,
    setSelectedNode,
    pendingOperationsRef,
  });

  // File operations
  const {
    createFolder,
    createFile,
    deleteNode,
    handleFileUploaded,
    handleFilesSync,
  } = useFileOperations({
    nodes,
    setNodes,
    setSelectedNode,
    pendingOperationsRef,
  });

  // Node operations
  const {
    renameNode,
    updateNodePath,
    markNodeForRename,
    clearRenameFlag,
    updateNodeProperty,
    getNodeById,
    getNodeChildren,
    getNodesByProject,
  } = useNodeOperations({
    nodes,
    setNodes,
    pendingOperationsRef,
  });

  // Bulk operations
  const {
    moveNode,
    duplicateNode,
    moveMultipleNodes,
    duplicateMultipleNodes,
    bulkUpdateNodeProperties,
    getNodesInFolder,
    validateBulkOperation,
  } = useBulkOperations({
    nodes,
    setNodes,
    pendingOperationsRef,
  });

  return {
    // Project operations
    createProject,
    renameProject,
    moveProject,
    duplicateProject,
    deleteProject,

    // File operations
    createFolder,
    createFile,
    deleteNode,
    handleFileUploaded,
    handleFilesSync,

    // Node operations
    renameNode,
    updateNodePath,
    markNodeForRename,
    clearRenameFlag,
    updateNodeProperty,
    getNodeById,
    getNodeChildren,
    getNodesByProject,

    // Bulk operations
    moveNode,
    duplicateNode,
    moveMultipleNodes,
    duplicateMultipleNodes,
    bulkUpdateNodeProperties,
    getNodesInFolder,
    validateBulkOperation,
  };
};