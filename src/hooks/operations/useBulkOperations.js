// src/hooks/operations/useBulkOperations.js
// Bulk operations like move, duplicate, and sync operations

import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { buildNodePath } from '../utils/pathUtils';

export const useBulkOperations = ({
  nodes,
  setNodes,
  pendingOperationsRef,
}) => {
  
  const moveNode = useCallback(async (nodeId, newParentId, newProjectId) => {
    const operationId = 'move_node_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      console.log('🚚 Moving node:', { nodeId, newParentId, newProjectId });
      
      const nodeToMove = nodes.find(n => n.id === nodeId);
      if (!nodeToMove) {
        throw new Error('Node not found');
      }
      
      // Calculate new file path
      const newPath = buildNodePath(newParentId, nodeToMove.name, newProjectId, nodes);
      
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === nodeId 
            ? { 
                ...node, 
                parent_id: newParentId, 
                parentId: newParentId,
                project_id: newProjectId,
                projectId: newProjectId,
                file_path: newPath
              } 
            : node
        )
      );
      
      // Update paths for all descendant nodes if this is a folder
      if (nodeToMove.type === 'folder') {
        const updateDescendantPaths = (parentId, projectId) => {
          const children = nodes.filter(node => 
            (node.parent_id === parentId || node.parentId === parentId)
          );
          
          children.forEach(child => {
            const childNewPath = buildNodePath(parentId, child.name, projectId, nodes);
            
            setNodes(prevNodes => 
              prevNodes.map(node => 
                node.id === child.id 
                  ? { 
                      ...node, 
                      project_id: projectId,
                      projectId: projectId,
                      file_path: childNewPath 
                    } 
                  : node
              )
            );
            
            // Recursively update children if this child is also a folder
            if (child.type === 'folder') {
              updateDescendantPaths(child.id, projectId);
            }
          });
        };
        
        setTimeout(() => {
          updateDescendantPaths(nodeId, newProjectId);
        }, 0);
      }
      
      console.log('✅ Node moved successfully to path:', newPath);
    } catch (error) {
      console.error('❌ Failed to move node:', error);
      throw error;
    } finally {
      pendingOperationsRef.current.delete(operationId);
    }
  }, [nodes, setNodes, pendingOperationsRef]);
  
  const duplicateNode = useCallback(async (nodeId) => {
    const operationId = 'duplicate_node_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      console.log('📋 Duplicating node:', nodeId);
      
      const originalNode = nodes.find(n => n.id === nodeId);
      if (!originalNode) {
        throw new Error('Node not found');
      }
      
      const newNodeId = uuidv4();
      const newName = originalNode.type === 'folder' 
        ? `${originalNode.name} (Copy)`
        : (() => {
            const parts = originalNode.name.split('.');
            if (parts.length > 1) {
              const extension = parts.pop();
              const baseName = parts.join('.');
              return `${baseName} (Copy).${extension}`;
            }
            return `${originalNode.name} (Copy)`;
          })();
      
      // Calculate new file path
      const newPath = buildNodePath(
        originalNode.parent_id || originalNode.parentId, 
        newName, 
        originalNode.project_id || originalNode.projectId,
        nodes
      );
      
      const newNode = {
        ...originalNode,
        id: newNodeId,
        name: newName,
        file_path: newPath
      };
      
      setNodes(prevNodes => [...prevNodes, newNode]);
      
      console.log('✅ Node duplicated successfully with path:', newPath);
      return newNodeId;
    } catch (error) {
      console.error('❌ Failed to duplicate node:', error);
      throw error;
    } finally {
      pendingOperationsRef.current.delete(operationId);
    }
  }, [nodes, setNodes, pendingOperationsRef]);

  const moveMultipleNodes = useCallback(async (nodeIds, newParentId, newProjectId) => {
    const operationId = 'move_multiple_nodes_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      console.log('🚚 Moving multiple nodes:', { nodeIds, newParentId, newProjectId });
      
      for (const nodeId of nodeIds) {
        await moveNode(nodeId, newParentId, newProjectId);
      }
      
      console.log('✅ Multiple nodes moved successfully');
    } catch (error) {
      console.error('❌ Failed to move multiple nodes:', error);
      throw error;
    } finally {
      pendingOperationsRef.current.delete(operationId);
    }
  }, [moveNode, pendingOperationsRef]);

  const duplicateMultipleNodes = useCallback(async (nodeIds) => {
    const operationId = 'duplicate_multiple_nodes_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      console.log('📋 Duplicating multiple nodes:', nodeIds);
      
      const duplicatedIds = [];
      for (const nodeId of nodeIds) {
        const newNodeId = await duplicateNode(nodeId);
        duplicatedIds.push(newNodeId);
      }
      
      console.log('✅ Multiple nodes duplicated successfully');
      return duplicatedIds;
    } catch (error) {
      console.error('❌ Failed to duplicate multiple nodes:', error);
      throw error;
    } finally {
      pendingOperationsRef.current.delete(operationId);
    }
  }, [duplicateNode, pendingOperationsRef]);

  const bulkUpdateNodeProperties = useCallback((nodeIds, updates) => {
    setNodes(prevNodes => 
      prevNodes.map(node => 
        nodeIds.includes(node.id) 
          ? { ...node, ...updates }
          : node
      )
    );
  }, [setNodes]);

  const getNodesInFolder = useCallback((folderId) => {
    const collectNodes = (parentId) => {
      const children = nodes.filter(node => 
        (node.parent_id === parentId || node.parentId === parentId)
      );
      
      let allNodes = [...children];
      
      children.forEach(child => {
        if (child.type === 'folder') {
          allNodes = [...allNodes, ...collectNodes(child.id)];
        }
      });
      
      return allNodes;
    };
    
    return collectNodes(folderId);
  }, [nodes]);

  const validateBulkOperation = useCallback((nodeIds, operation) => {
    const errors = [];
    
    nodeIds.forEach(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) {
        errors.push(`Node ${nodeId} not found`);
      }
    });
    
    if (operation === 'move') {
      // Additional validation for move operations
      const hasCircularReference = nodeIds.some(nodeId => {
        const descendants = getNodesInFolder(nodeId);
        return descendants.some(desc => nodeIds.includes(desc.id));
      });
      
      if (hasCircularReference) {
        errors.push('Cannot move folder into itself or its descendants');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, [nodes, getNodesInFolder]);

  return {
    moveNode,
    duplicateNode,
    moveMultipleNodes,
    duplicateMultipleNodes,
    bulkUpdateNodeProperties,
    getNodesInFolder,
    validateBulkOperation,
  };
};