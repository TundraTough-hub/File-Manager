// src/hooks/useAppOperations.js
// Custom hook for all app operations (CRUD operations for projects, nodes, files)

import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { v4 as uuidv4 } from 'uuid';

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
  
  const createProject = useCallback(async (name, clientId = null) => {
    const operationId = 'create_project_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      console.log('🚀 createProject called with:', { name, clientId });
      
      const projectId = uuidv4();
      
      const rootId = await invoke('create_folder', {
        parentId: '',
        name: '__PROJECT_ROOT__',
        projectId
      });
      
      const newProject = {
        id: projectId,
        name: name.trim(),
        root_id: rootId,
        client_id: clientId
      };
      
      const newNode = {
        id: rootId,
        name: '__PROJECT_ROOT__',
        type: 'folder',
        parent_id: null,
        project_id: projectId,
        hidden: true,
        file_path: '',
        extension: null,
      };
      
      console.log('📦 Creating new project with hidden root folder');
      
      setProjects(prevProjects => [...prevProjects, newProject]);
      setNodes(prevNodes => [...prevNodes, newNode]);
      
      if (clientId) {
        setClients(prevClients => 
          prevClients.map(client => 
            client.id === clientId 
              ? { ...client, projects: [...(client.projects || []), projectId] } 
              : client
          )
        );
      }
      
      console.log('✅ createProject completed successfully');
      return projectId;
    } catch (error) {
      console.error('❌ createProject failed:', error);
      throw error;
    } finally {
      pendingOperationsRef.current.delete(operationId);
    }
  }, [setProjects, setNodes, setClients, pendingOperationsRef]);

  const createFolder = useCallback(async (parentId, name, projectId, shouldRename = false) => {
    const operationId = 'create_folder_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      
      const siblings = nodes.filter(node => 
        (node.parent_id === parentId || node.parentId === parentId) &&
        (node.project_id === projectId || node.projectId === projectId)
      );
      
      const existingNames = siblings.map(node => node.name.toLowerCase());
      let finalName = name;
      let counter = 1;
      
      while (existingNames.includes(finalName.toLowerCase())) {
        finalName = `${name} (${counter})`;
        counter++;
      }
      
      const folderId = await invoke('create_folder', {
        parentId: parentId || '',
        name: finalName,
        projectId
      });
      
      const newNode = {
        id: folderId,
        name: finalName,
        type: 'folder',
        parent_id: parentId,
        project_id: projectId,
        shouldRename: shouldRename,
        file_path: finalName,
        extension: null,
        hidden: false,
      };
      
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
      
      const siblings = nodes.filter(node => 
        (node.parent_id === parentId || node.parentId === parentId) &&
        (node.project_id === projectId || node.projectId === projectId)
      );
      
      const existingNames = siblings.map(node => node.name.toLowerCase());
      let finalName = name;
      let counter = 1;
      
      while (existingNames.includes(finalName.toLowerCase())) {
        const parts = name.split('.');
        if (parts.length > 1) {
          const extension = parts.pop();
          const baseName = parts.join('.');
          finalName = `${baseName} (${counter}).${extension}`;
        } else {
          finalName = `${name} (${counter})`;
        }
        counter++;
      }
      
      let extension = '';
      const parts = finalName.split('.');
      if (parts.length > 1) {
        extension = parts[parts.length - 1];
      }
      
      const fileId = await invoke('create_file', {
        parentId: parentId || '',
        name: finalName,
        projectId
      });
      
      const newNode = {
        id: fileId,
        name: finalName,
        type: 'file',
        extension: extension || null,
        parent_id: parentId,
        project_id: projectId,
        shouldRename: shouldRename,
        file_path: finalName,
        hidden: false,
      };
      
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
  
  const renameNode = useCallback(async (nodeId, newName) => {
    const operationId = 'rename_node_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      
      if (!newName.trim()) {
        throw new Error('Name cannot be empty');
      }
      
      const nodeToRename = nodes.find(n => n.id === nodeId);
      if (!nodeToRename) {
        throw new Error('Node not found');
      }
      
      const siblings = nodes.filter(node => 
        (node.parent_id === nodeToRename.parent_id || node.parentId === nodeToRename.parentId) &&
        (node.project_id === nodeToRename.project_id || node.projectId === nodeToRename.projectId) &&
        node.id !== nodeId
      );
      
      const existingNames = siblings.map(node => node.name.toLowerCase());
      
      if (existingNames.includes(newName.trim().toLowerCase())) {
        throw new Error(`A ${nodeToRename.type} with this name already exists`);
      }
      
      await invoke('rename_node', { 
        nodeId, 
        newName: newName.trim(),
        filePath: nodeToRename.file_path || nodeToRename.name,
        projectId: nodeToRename.project_id || nodeToRename.projectId
      });
      
      setNodes(prevNodes => prevNodes.map(node => {
        if (node.id === nodeId) {
          let extension = node.extension;
          if (node.type === 'file') {
            const parts = newName.trim().split('.');
            if (parts.length > 1) {
              extension = parts[parts.length - 1];
            } else {
              extension = null;
            }
          }
          return { 
            ...node, 
            name: newName.trim(), 
            extension,
            file_path: newName.trim(),
            shouldRename: false,
          };
        }
        return node;
      }));
      
      console.log('✅ Node renamed successfully');
    } catch (error) {
      console.error('❌ Failed to rename node:', error);
      throw error;
    } finally {
      pendingOperationsRef.current.delete(operationId);
    }
  }, [nodes, setNodes, pendingOperationsRef]);
  
  const deleteNode = useCallback(async (nodeId) => {
    const operationId = 'delete_node_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      
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
      
      setNodes(prevNodes => prevNodes.filter(node => !nodeIdsToDelete.includes(node.id)));
      
      const projectToDelete = projects.find(p => 
        p.rootId === nodeId || p.root_id === nodeId
      );
      
      if (projectToDelete) {
        setProjects(prevProjects => prevProjects.filter(p => p.id !== projectToDelete.id));
        
        const clientId = projectToDelete.clientId || projectToDelete.client_id;
        if (clientId) {
          setClients(prevClients => 
            prevClients.map(client => 
              client.id === clientId
                ? { ...client, projects: (client.projects || []).filter(id => id !== projectToDelete.id) }
                : client
            )
          );
        }
      }
      
      setSelectedNode(prevSelected => {
        if (prevSelected && nodeIdsToDelete.includes(prevSelected)) {
          return null;
        }
        return prevSelected;
      });
      
      console.log('✅ Node deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete node:', error);
    } finally {
      pendingOperationsRef.current.delete(operationId);
    }
  }, [nodes, projects, setNodes, setProjects, setClients, setSelectedNode, pendingOperationsRef]);

  const deleteProject = useCallback(async (projectId) => {
    const operationId = 'delete_project_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      const project = projects.find(p => p.id === projectId);
      if (project) {
        const rootNodeId = project.rootId || project.root_id;
        
        if (rootNodeId) {
          await deleteNode(rootNodeId);
        } else {
          const projectNodes = nodes.filter(node => 
            node.project_id === projectId || node.projectId === projectId
          );
          
          for (const node of projectNodes) {
            try {
              await invoke('delete_node', { 
                nodeId: node.id,
                filePath: node.file_path || node.name,
                projectId: projectId
              });
            } catch (error) {
              console.warn('Failed to delete node:', node.id, error);
            }
          }
          
          setNodes(prevNodes => 
            prevNodes.filter(node => 
              node.project_id !== projectId && node.projectId !== projectId
            )
          );
          
          setProjects(prevProjects => 
            prevProjects.filter(p => p.id !== projectId)
          );
          
          const clientId = project.clientId || project.client_id;
          if (clientId) {
            setClients(prevClients => 
              prevClients.map(client => 
                client.id === clientId
                  ? { ...client, projects: (client.projects || []).filter(id => id !== projectId) }
                  : client
              )
            );
          }
        }
      }
      console.log('✅ Project deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete project:', error);
    } finally {
      pendingOperationsRef.current.delete(operationId);
    }
  }, [projects, nodes, deleteNode, setNodes, setProjects, setClients, pendingOperationsRef]);

  const handleFileUploaded = useCallback(async (uploadedFile) => {
    const operationId = 'file_upload_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      console.log('📁 Processing uploaded file:', uploadedFile);
      
      const newNode = {
        id: uploadedFile.id || uuidv4(),
        name: uploadedFile.name,
        type: uploadedFile.type || 'file',
        extension: uploadedFile.extension || null,
        parent_id: uploadedFile.parent_id || null,
        project_id: uploadedFile.project_id,
        file_path: uploadedFile.file_path || uploadedFile.name,
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
        
        console.log('✅ Adding uploaded file to nodes array');
        return [...prevNodes, newNode];
      });
      
    } catch (error) {
      console.error('❌ Failed to process uploaded file:', error);
    } finally {
      pendingOperationsRef.current.delete(operationId);
    }
  }, [setNodes, pendingOperationsRef]);

  const handleFilesSync = useCallback(async (newFiles) => {
    const operationId = 'files_sync_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      console.log('🔄 Processing synced files:', newFiles);
      
      setNodes(prevNodes => {
        const existingIds = new Set(prevNodes.map(n => n.id));
        const newUniqueFiles = newFiles.filter(file => !existingIds.has(file.id));
        
        if (newUniqueFiles.length > 0) {
          console.log('✅ Adding', newUniqueFiles.length, 'new synced files to state');
          return [...prevNodes, ...newUniqueFiles];
        }
        
        return prevNodes;
      });
      
      console.log('✅ File sync completed successfully');
    } catch (error) {
      console.error('❌ Failed to process synced files:', error);
    } finally {
      pendingOperationsRef.current.delete(operationId);
    }
  }, [setNodes, pendingOperationsRef]);

  const renameProject = useCallback(async (projectId, newName) => {
    const operationId = 'rename_project_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      console.log('✏️ Renaming project:', { projectId, newName });
      
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId 
            ? { ...project, name: newName } 
            : project
        )
      );
      
      console.log('✅ Project renamed successfully');
    } catch (error) {
      console.error('❌ Failed to rename project:', error);
    } finally {
      pendingOperationsRef.current.delete(operationId);
    }
  }, [setProjects, pendingOperationsRef]);
  
  const moveProject = useCallback(async (projectId, newClientId) => {
    const operationId = 'move_project_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      console.log('🚚 Moving project:', { projectId, newClientId });
      
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId 
            ? { ...project, client_id: newClientId, clientId: newClientId } 
            : project
        )
      );
      
      console.log('✅ Project moved successfully');
    } catch (error) {
      console.error('❌ Failed to move project:', error);
    } finally {
      pendingOperationsRef.current.delete(operationId);
    }
  }, [setProjects, pendingOperationsRef]);
  
  const duplicateProject = useCallback(async (projectId) => {
    const operationId = 'duplicate_project_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      console.log('📋 Duplicating project:', projectId);
      
      const originalProject = projects.find(p => p.id === projectId);
      if (!originalProject) {
        throw new Error('Project not found');
      }
      
      const newProjectId = uuidv4();
      
      const rootId = await invoke('create_folder', {
        parentId: '',
        name: '__PROJECT_ROOT__',
        projectId: newProjectId
      });
      
      const newProject = {
        ...originalProject,
        id: newProjectId,
        name: `${originalProject.name} (Copy)`,
        root_id: rootId
      };
      
      const newNode = {
        id: rootId,
        name: '__PROJECT_ROOT__',
        type: 'folder',
        parent_id: null,
        project_id: newProjectId,
        hidden: true,
        file_path: ''
      };
      
      setProjects(prevProjects => [...prevProjects, newProject]);
      setNodes(prevNodes => [...prevNodes, newNode]);
      
      console.log('✅ Project duplicated successfully');
      return newProjectId;
    } catch (error) {
      console.error('❌ Failed to duplicate project:', error);
      throw error;
    } finally {
      pendingOperationsRef.current.delete(operationId);
    }
  }, [projects, setProjects, setNodes, pendingOperationsRef]);
  
  const moveNode = useCallback(async (nodeId, newParentId, newProjectId) => {
    const operationId = 'move_node_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      console.log('🚚 Moving node:', { nodeId, newParentId, newProjectId });
      
      const nodeToMove = nodes.find(n => n.id === nodeId);
      if (!nodeToMove) {
        throw new Error('Node not found');
      }
      
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === nodeId 
            ? { 
                ...node, 
                parent_id: newParentId, 
                parentId: newParentId,
                project_id: newProjectId,
                projectId: newProjectId
              } 
            : node
        )
      );
      
      console.log('✅ Node moved successfully');
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
      
      const newNode = {
        ...originalNode,
        id: newNodeId,
        name: newName,
        file_path: newName
      };
      
      setNodes(prevNodes => [...prevNodes, newNode]);
      
      console.log('✅ Node duplicated successfully');
      return newNodeId;
    } catch (error) {
      console.error('❌ Failed to duplicate node:', error);
      throw error;
    } finally {
      pendingOperationsRef.current.delete(operationId);
    }
  }, [nodes, setNodes, pendingOperationsRef]);

  return {
    createProject,
    createFolder,
    createFile,
    renameNode,
    deleteNode,
    deleteProject,
    handleFileUploaded,
    handleFilesSync,
    renameProject,
    moveProject,
    duplicateProject,
    moveNode,
    duplicateNode,
  };
};