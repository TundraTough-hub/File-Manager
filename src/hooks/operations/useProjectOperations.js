// src/hooks/operations/useProjectOperations.js
// Project-level CRUD operations

import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { v4 as uuidv4 } from 'uuid';

export const useProjectOperations = ({
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

  const deleteProject = useCallback(async (projectId) => {
    const operationId = 'delete_project_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      const project = projects.find(p => p.id === projectId);
      if (!project) {
        console.warn('Project not found:', projectId);
        return;
      }

      const rootNodeId = project.rootId || project.root_id;
      
      // Delete all project nodes first
      const projectNodes = nodes.filter(node => 
        node.project_id === projectId || node.projectId === projectId
      );
      
      // Delete files from backend
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
      
      // Remove project directory
      try {
        await invoke('delete_project_directory', {
          projectId: projectId
        });
      } catch (error) {
        console.warn('Failed to delete project directory:', error);
      }
      
      // Update state
      setNodes(prevNodes => 
        prevNodes.filter(node => 
          node.project_id !== projectId && node.projectId !== projectId
        )
      );
      
      setProjects(prevProjects => 
        prevProjects.filter(p => p.id !== projectId)
      );
      
      // Update client associations
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
      
      // Clear selection if deleted project was selected
      setSelectedNode(prevSelected => {
        const selectedNodeData = nodes.find(n => n.id === prevSelected);
        if (selectedNodeData && (selectedNodeData.project_id === projectId || selectedNodeData.projectId === projectId)) {
          return null;
        }
        return prevSelected;
      });
      
      console.log('✅ Project deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete project:', error);
      throw error;
    } finally {
      pendingOperationsRef.current.delete(operationId);
    }
  }, [projects, nodes, setNodes, setProjects, setClients, setSelectedNode, pendingOperationsRef]);

  return {
    createProject,
    renameProject,
    moveProject,
    duplicateProject,
    deleteProject,
  };
};