// src/hooks/operations/useNodeOperations.js
// Node-level operations like rename and individual node management

import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { buildNodePath, validateNodeName, extractFileExtension, updateDescendantPaths } from '../utils/pathUtils';

export const useNodeOperations = ({
  nodes,
  setNodes,
  pendingOperationsRef,
}) => {
  
  const renameNode = useCallback(async (nodeId, newName) => {
    const operationId = 'rename_node_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      
      const trimmedName = newName.trim();
      
      // Validate the new name
      const validation = validateNodeName(trimmedName);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      
      const nodeToRename = nodes.find(n => n.id === nodeId);
      if (!nodeToRename) {
        throw new Error('Node not found');
      }
      
      // Check for name conflicts in the same parent
      const siblings = nodes.filter(node => 
        (node.parent_id === nodeToRename.parent_id || node.parentId === nodeToRename.parentId) &&
        (node.project_id === nodeToRename.project_id || node.projectId === nodeToRename.projectId) &&
        node.id !== nodeId
      );
      
      const existingNames = siblings.map(node => node.name.toLowerCase());
      
      if (existingNames.includes(trimmedName.toLowerCase())) {
        throw new Error(`A ${nodeToRename.type} with this name already exists`);
      }
      
      // Rename via backend
      await invoke('rename_node', { 
        nodeId, 
        newName: trimmedName,
        filePath: nodeToRename.file_path || nodeToRename.name,
        projectId: nodeToRename.project_id || nodeToRename.projectId
      });
      
      // Update the node and recalculate its path
      setNodes(prevNodes => {
        return prevNodes.map(node => {
          if (node.id === nodeId) {
            let extension = node.extension;
            if (node.type === 'file') {
              extension = extractFileExtension(trimmedName);
            }
            
            // Recalculate the file path with the new name
            const newPath = buildNodePath(
              node.parent_id || node.parentId, 
              trimmedName, 
              node.project_id || node.projectId,
              prevNodes
            );
            
            return { 
              ...node, 
              name: trimmedName, 
              extension,
              file_path: newPath,
              shouldRename: false,
            };
          }
          return node;
        });
      });
      
      // Update paths for all descendant nodes if this is a folder
      if (nodeToRename.type === 'folder') {
        const updateNodePath = (childNodeId) => {
          setNodes(prevNodes => prevNodes.map(node => {
            if (node.id === childNodeId) {
              const newPath = buildNodePath(
                node.parent_id || node.parentId,
                node.name,
                node.project_id || node.projectId,
                prevNodes
              );
              return { ...node, file_path: newPath };
            }
            return node;
          }));
        };
        
        // Use a timeout to ensure the parent's path is updated first
        setTimeout(() => {
          updateDescendantPaths(nodeId, nodes, updateNodePath);
        }, 0);
      }
      
      console.log('✅ Node renamed successfully');
    } catch (error) {
      console.error('❌ Failed to rename node:', error);
      throw error;
    } finally {
      pendingOperationsRef.current.delete(operationId);
    }
  }, [nodes, setNodes, pendingOperationsRef]);

  const updateNodePath = useCallback((nodeId, newPath) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId 
          ? { ...node, file_path: newPath }
          : node
      )
    );
  }, [setNodes]);

  const markNodeForRename = useCallback((nodeId) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId 
          ? { ...node, shouldRename: true }
          : node
      )
    );
  }, [setNodes]);

  const clearRenameFlag = useCallback((nodeId) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId 
          ? { ...node, shouldRename: false }
          : node
      )
    );
  }, [setNodes]);

  const updateNodeProperty = useCallback((nodeId, property, value) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === nodeId 
          ? { ...node, [property]: value }
          : node
      )
    );
  }, [setNodes]);

  const getNodeById = useCallback((nodeId) => {
    return nodes.find(n => n.id === nodeId);
  }, [nodes]);

  const getNodeChildren = useCallback((nodeId) => {
    return nodes.filter(node => 
      (node.parent_id === nodeId || node.parentId === nodeId)
    );
  }, [nodes]);

  const getNodesByProject = useCallback((projectId) => {
    return nodes.filter(node => 
      (node.project_id === projectId || node.projectId === projectId)
    );
  }, [nodes]);

  return {
    renameNode,
    updateNodePath,
    markNodeForRename,
    clearRenameFlag,
    updateNodeProperty,
    getNodeById,
    getNodeChildren,
    getNodesByProject,
  };
};