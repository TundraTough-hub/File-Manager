// src/hooks/operations/useFileOperations.js
// File and folder creation, deletion operations

import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { v4 as uuidv4 } from 'uuid';
import { buildNodePath, generateUniqueName, extractFileExtension } from '../utils/pathUtils';

export const useFileOperations = ({
  nodes,
  setNodes,
  setSelectedNode,
  pendingOperationsRef,
}) => {

  const createFolder = useCallback(async (parentId, name, projectId, shouldRename = false) => {
    const operationId = 'create_folder_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      
      // Check for name conflicts in the same parent
      const siblings = nodes.filter(node => 
        (node.parent_id === parentId || node.parentId === parentId) &&
        (node.project_id === projectId || node.projectId === projectId)
      );
      
      const existingNames = siblings.map(node => node.name);
      const finalName = generateUniqueName(name, existingNames);
      
      // Create the folder via backend
      const folderId = await invoke('create_folder', {
        parentId: parentId || '',
        name: finalName,
        projectId
      });
      
      // Build the relative path for this folder
      const relativePath = buildNodePath(parentId, finalName, projectId, nodes);
      
      const newNode = {
        id: folderId,
        name: finalName,
        type: 'folder',
        parent_id: parentId,
        project_id: projectId,
        shouldRename: shouldRename,
        file_path: relativePath,
        extension: null,
        hidden: false,
      };
      
      console.log('📁 Created folder with path:', relativePath);
      
      const nodeExists = nodes.some(n => n.id === folderId);
      if (!nodeExists) {
        setNodes(prevNodes => [...prevNodes, newNode]);
      }
      
      return folderId;
    } catch (error) {
      console.error('❌ Failed to create folder:', error);
      throw error;
    } finally {
      pendingOperationsRef.current.delete(operationId);
    }
  }, [nodes, setNodes, pendingOperationsRef]);
  
  const createFile = useCallback(async (parentId, name, projectId, shouldRename = false) => {
    const operationId = 'create_file_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      
      // Check for name conflicts in the same parent
      const siblings = nodes.filter(node => 
        (node.parent_id === parentId || node.parentId === parentId) &&
        (node.project_id === projectId || node.projectId === projectId)
      );
      
      const existingNames = siblings.map(node => node.name);
      const finalName = generateUniqueName(name, existingNames);
      
      // Extract extension
      const extension = extractFileExtension(finalName);
      
      // Create the file via backend
      const fileId = await invoke('create_file', {
        parentId: parentId || '',
        name: finalName,
        projectId
      });
      
      // Build the relative path for this file
      const relativePath = buildNodePath(parentId, finalName, projectId, nodes);
      
      const newNode = {
        id: fileId,
        name: finalName,
        type: 'file',
        extension: extension,
        parent_id: parentId,
        project_id: projectId,
        shouldRename: shouldRename,
        file_path: relativePath,
        hidden: false,
      };
      
      console.log('📄 Created file with path:', relativePath);
      
      const nodeExists = nodes.some(n => n.id === fileId);
      if (!nodeExists) {
        setNodes(prevNodes => [...prevNodes, newNode]);
      }
      
      return fileId;
    } catch (error) {
      console.error('❌ Failed to create file:', error);
      throw error;
    } finally {
      pendingOperationsRef.current.delete(operationId);
    }
  }, [nodes, setNodes, pendingOperationsRef]);

  const deleteNode = useCallback(async (nodeId) => {
    const operationId = 'delete_node_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      
      // Get all child node IDs recursively
      const getChildNodeIds = (parentId) => {
        const children = nodes.filter(node => 
          node.parentId === parentId || node.parent_id === parentId
        );
        let childIds = [parentId];
        
        children.forEach(child => {
          childIds = [...childIds, ...getChildNodeIds(child.id)];
        });
        
        return childIds;
      };
      
      const nodeIdsToDelete = getChildNodeIds(nodeId);
      const nodeToDelete = nodes.find(n => n.id === nodeId);
      
      if (nodeToDelete) {
        await invoke('delete_node', { 
          nodeId, 
          filePath: nodeToDelete.file_path || nodeToDelete.name,
          projectId: nodeToDelete.project_id || nodeToDelete.projectId
        });
      }
      
      // Remove nodes from state
      setNodes(prevNodes => prevNodes.filter(node => !nodeIdsToDelete.includes(node.id)));
      
      // Clear selection if deleted node was selected
      setSelectedNode(prevSelected => {
        if (prevSelected && nodeIdsToDelete.includes(prevSelected)) {
          return null;
        }
        return prevSelected;
      });
      
      console.log('✅ Node deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete node:', error);
      throw error;
    } finally {
      pendingOperationsRef.current.delete(operationId);
    }
  }, [nodes, setNodes, setSelectedNode, pendingOperationsRef]);

  const handleFileUploaded = useCallback(async (uploadedFile) => {
    const operationId = 'file_upload_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      console.log('📁 Processing uploaded file:', uploadedFile);
      
      // Calculate the proper file path for uploaded files
      const filePath = uploadedFile.file_path || uploadedFile.name;
      
      const newNode = {
        id: uploadedFile.id || uuidv4(),
        name: uploadedFile.name,
        type: uploadedFile.type || 'file',
        extension: uploadedFile.extension || null,
        parent_id: uploadedFile.parent_id || null,
        project_id: uploadedFile.project_id,
        file_path: filePath,
        size: uploadedFile.size || 0,
        hidden: false,
        is_binary: uploadedFile.is_binary || false,
      };
      
      setNodes(prevNodes => {
        const nodeExists = prevNodes.some(n => n.id === newNode.id);
        if (nodeExists) {
          console.log('⚠️ File already exists in nodes, skipping');
          return prevNodes;
        }
        
        console.log('✅ Adding uploaded file to nodes array with path:', filePath);
        return [...prevNodes, newNode];
      });
      
    } catch (error) {
      console.error('❌ Failed to process uploaded file:', error);
    } finally {
      pendingOperationsRef.current.delete(operationId);
    }
  }, [setNodes, pendingOperationsRef]);

  // Add this to your useFileOperations.js hook - FIXED handleFilesSync
  const handleFilesSync = useCallback(async (newFiles, options = {}) => {
    const operationId = 'files_sync_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      console.log('🔄 SYNC: Processing synced files:', newFiles);
      console.log('🔄 SYNC: Sync options:', options);
      
      if (!newFiles || newFiles.length === 0) {
        console.log('🔄 SYNC: No files to sync');
        return;
      }

      setNodes(prevNodes => {
        // If this is a full rebuild, we need to replace ALL nodes for this project
        if (options.isFullRebuild && newFiles.length > 0) {
          const projectId = newFiles[0].project_id || newFiles[0].projectId;
          
          if (projectId) {
            console.log('🔨 SYNC: Full rebuild - replacing all nodes for project:', projectId);
            
            // Keep nodes from other projects, replace all nodes for this project
            const otherProjectNodes = prevNodes.filter(node => 
              (node.project_id !== projectId && node.projectId !== projectId)
            );
            
            const processedNewFiles = newFiles.map(file => ({
              ...file,
              id: file.id || file.node_id,
              project_id: file.project_id || file.projectId || projectId,
              projectId: file.project_id || file.projectId || projectId,
              parent_id: file.parent_id || file.parentId,
              parentId: file.parent_id || file.parentId,
              file_path: file.file_path || file.name,
              hidden: file.hidden || false,
            }));
            
            console.log('🔨 SYNC: Rebuilt project with', processedNewFiles.length, 'files');
            return [...otherProjectNodes, ...processedNewFiles];
          }
        }
        
        // For normal sync, add only new files that don't already exist
        const existingIds = new Set(prevNodes.map(n => n.id));
        const newUniqueFiles = newFiles
          .filter(file => !existingIds.has(file.id || file.node_id))
          .map(file => ({
            ...file,
            id: file.id || file.node_id,
            project_id: file.project_id || file.projectId,
            projectId: file.project_id || file.projectId,
            parent_id: file.parent_id || file.parentId,
            parentId: file.parent_id || file.parentId,
            file_path: file.file_path || file.name,
            hidden: file.hidden || false,
          }));
        
        if (newUniqueFiles.length > 0) {
          console.log('✅ SYNC: Adding', newUniqueFiles.length, 'new synced files to state');
          return [...prevNodes, ...newUniqueFiles];
        }
        
        console.log('🔄 SYNC: No new unique files to add');
        return prevNodes;
      });
      
      console.log('✅ SYNC: File sync completed successfully');
    } catch (error) {
      console.error('❌ SYNC: Failed to process synced files:', error);
    } finally {
      pendingOperationsRef.current.delete(operationId);
    }
  }, [setNodes, pendingOperationsRef]);

  return {
    createFolder,
    createFile,
    deleteNode,
    handleFileUploaded,
    handleFilesSync,
  };
};