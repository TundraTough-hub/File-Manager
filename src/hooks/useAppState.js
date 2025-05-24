// src/hooks/useAppState.js
// Custom hook for managing app-wide state and operations

import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { v4 as uuidv4 } from 'uuid';

export const useAppState = () => {
  const [projects, setProjects] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Enhanced refs for better state management
  const isLoadingRef = useRef(false);
  const saveTimeoutRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const pendingOperationsRef = useRef(new Set());
  
  // Load projects on initialization
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    loadProjects();
  }, []);
  
  // Enhanced auto-save system
  useEffect(() => {
    if (!isLoaded || isLoadingRef.current || pendingOperationsRef.current.size > 0) {
      console.log('🚫 Skipping save - loading or pending operations:', {
        isLoaded,
        isLoading: isLoadingRef.current,
        pendingOps: pendingOperationsRef.current.size
      });
      return;
    }
    
    console.log('🔄 Auto-save triggered by state change:', {
      projects: projects.length,
      nodes: nodes.length,
      clients: clients.length
    });
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveProjects();
    }, 300);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [projects, nodes, clients, isLoaded]);

  const migrateExistingData = (data) => {
    console.log('🔧 MIGRATION: Checking for orphaned files to fix...');
    
    const { projects, nodes, clients } = data;
    let migratedNodes = [...nodes];
    let migrationCount = 0;
    
    projects.forEach(project => {
      const projectRootId = project.root_id || project.rootId;
      const projectId = project.id;
      
      if (!projectRootId) return;
      
      const orphanedNodes = migratedNodes.filter(node => 
        (node.project_id === projectId || node.projectId === projectId) &&
        (node.parent_id === null || node.parent_id === undefined) &&
        !node.hidden &&
        node.name !== '__PROJECT_ROOT__'
      );
      
      if (orphanedNodes.length > 0) {
        console.log(`🔧 MIGRATION: Found ${orphanedNodes.length} orphaned nodes in project ${project.name}`);
        
        orphanedNodes.forEach(node => {
          console.log(`🔧 MIGRATION: Fixing orphaned node: ${node.name} -> parent: ${projectRootId}`);
          
          migratedNodes = migratedNodes.map(n => 
            n.id === node.id 
              ? { 
                  ...n, 
                  parent_id: projectRootId,
                  parentId: projectRootId,
                }
              : n
          );
          migrationCount++;
        });
      }
    });
    
    if (migrationCount > 0) {
      console.log(`✅ MIGRATION: Fixed ${migrationCount} orphaned files/folders`);
      return { ...data, nodes: migratedNodes };
    } else {
      console.log('✅ MIGRATION: No orphaned files found, data is clean');
      return data;
    }
  };
  
  const loadProjects = async () => {
    try {
      isLoadingRef.current = true;
      console.log('📥 Loading projects...');
      
      const data = await invoke('load_projects');
      console.log('📋 Loaded data:', {
        projects: data.projects?.length || 0,
        nodes: data.nodes?.length || 0,
        clients: data.clients?.length || 0
      });
      
      const migratedData = migrateExistingData(data);
      
      setProjects(migratedData.projects || []);
      setNodes(migratedData.nodes || []);
      setClients(migratedData.clients || []);
      
      setTimeout(() => {
        isLoadingRef.current = false;
        setIsLoaded(true);
        console.log('✅ Loading complete, auto-save enabled');
      }, 100);
      
    } catch (error) {
      console.error('❌ Failed to load projects:', error);
      isLoadingRef.current = false;
      setIsLoaded(true);
    }
  };
  
  const saveProjects = useCallback(async () => {
    if (pendingOperationsRef.current.has('save')) {
      console.log('🚫 Save already in progress, skipping');
      return;
    }
    
    try {
      pendingOperationsRef.current.add('save');
      console.log('💾 Saving projects...', {
        projects: projects.length,
        nodes: nodes.length,
        clients: clients.length
      });
      
      const cleanedProjects = projects.map(project => ({
        ...project,
        id: project.id || uuidv4(),
        name: project.name || 'Untitled Project',
        root_id: project.root_id || project.rootId || '',
        client_id: project.client_id || project.clientId || null,
      }));
      
      const cleanedNodes = nodes.map(node => ({
        ...node,
        id: node.id || uuidv4(),
        name: node.name || 'Untitled',
        type: node.type || 'file',
        parent_id: node.parent_id || node.parentId || null,
        project_id: node.project_id || node.projectId || '',
        file_path: node.file_path || node.name || '',
        hidden: node.hidden || false,
        extension: node.extension || null,
      }));
      
      const cleanedClients = clients.map(client => ({
        ...client,
        id: client.id || uuidv4(),
        name: client.name || 'Untitled Client',
        projects: client.projects || [],
        color: client.color || null,
      }));
      
      await invoke('save_projects', {
        data: { 
          projects: cleanedProjects, 
          nodes: cleanedNodes, 
          clients: cleanedClients 
        }
      });
      
      console.log('✅ Save successful!');
    } catch (error) {
      console.error('❌ Failed to save projects:', error);
    } finally {
      pendingOperationsRef.current.delete('save');
    }
  }, [projects, nodes, clients]);

  return {
    // State
    projects,
    nodes,
    clients,
    selectedNode,
    selectedProject,
    isLoaded,
    
    // Setters
    setProjects,
    setNodes,
    setClients,
    setSelectedNode,
    setSelectedProject,
    
    // Internal refs
    pendingOperationsRef,
    
    // Functions
    loadProjects,
    saveProjects,
  };
};