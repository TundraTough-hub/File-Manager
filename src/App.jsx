// src/App.jsx - Fixed import path
import React from 'react';
import { ChakraProvider, Flex, Box, Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/sidebar/Sidebar';
import MainPanel from './components/MainPanel';
import Toolbar from './components/Toolbar';
import ClientManager from './components/ClientManager';
import CodeRunner from './components/CodeRunner';
import DataFilePreview from './components/DataFilePreview';
import { invoke } from '@tauri-apps/api/tauri';
import { v4 as uuidv4 } from 'uuid';
import FileSyncButton from './components/FileSyncButton';

function App() {
  const [projects, setProjects] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Enhanced refs for better state management
  const isLoadingRef = useRef(false);
  const saveTimeoutRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const pendingOperationsRef = useRef(new Set());
  
  // Load projects on app startup
  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    loadProjects();
  }, []);
  
  // Enhanced auto-save system with operation tracking
  useEffect(() => {
    // Don't save if we're still loading or have pending operations
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
    
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Debounce saves with longer timeout for stability
    saveTimeoutRef.current = setTimeout(() => {
      saveProjects();
    }, 300);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [projects, nodes, clients, isLoaded]);
  
  // Update your existing loadProjects function
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
      
      // MIGRATION: Fix any existing orphaned files
      const migratedData = migrateExistingData(data);
      
      // Batch state updates to prevent multiple re-renders
      setProjects(migratedData.projects || []);
      setNodes(migratedData.nodes || []);
      setClients(migratedData.clients || []);
      
      // Mark as loaded after a short delay to ensure all updates complete
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

  // Add this function right after the existing loadProjects function
  const migrateExistingData = (data) => {
    console.log('🔧 MIGRATION: Checking for orphaned files to fix...');
    
    const { projects, nodes, clients } = data;
    let migratedNodes = [...nodes];
    let migrationCount = 0;
    
    // Find files/folders with null parent_id that should be in project roots
    projects.forEach(project => {
      const projectRootId = project.root_id || project.rootId;
      const projectId = project.id;
      
      if (!projectRootId) return;
      
      // Find orphaned nodes for this project (parent_id is null but should be project root)
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
          
          // Update the node to have the correct parent
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
  
  const saveProjects = useCallback(async () => {
    // Prevent concurrent saves
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
      
      // Enhanced data cleaning with validation
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
  
  const createProject = async (name, clientId = null) => {
    const operationId = 'create_project_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      console.log('🚀 createProject called with:', { name, clientId });
      
      const projectId = uuidv4();
      
      // Create hidden root folder through backend
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
      
      // Batch updates
      setProjects(prevProjects => [...prevProjects, newProject]);
      setNodes(prevNodes => [...prevNodes, newNode]);
      
      // Update client's project list if needed
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
  };

  const createFolder = async (parentId, name, projectId, shouldRename = false) => {
    const operationId = 'create_folder_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      
      // Check for name collisions
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
      
      // Create through backend
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
      
      // Prevent duplicate auto-rename triggers
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
  };
  
  const createFile = async (parentId, name, projectId, shouldRename = false) => {
    const operationId = 'create_file_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      
      // Check for name collisions
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
      
      // Create through backend
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
      
      // Prevent duplicate nodes
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
  };
  
  const renameNode = async (nodeId, newName) => {
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
      
      // Check for name collisions
      const siblings = nodes.filter(node => 
        (node.parent_id === nodeToRename.parent_id || node.parentId === nodeToRename.parentId) &&
        (node.project_id === nodeToRename.project_id || node.projectId === nodeToRename.projectId) &&
        node.id !== nodeId
      );
      
      const existingNames = siblings.map(node => node.name.toLowerCase());
      
      if (existingNames.includes(newName.trim().toLowerCase())) {
        throw new Error(`A ${nodeToRename.type} with this name already exists`);
      }
      
      // Update through backend
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
            shouldRename: false, // Clear the rename flag
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
  };
  
  const deleteNode = async (nodeId) => {
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
      
      // Check if we're deleting a project's root
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
      
      if (selectedNode && nodeIdsToDelete.includes(selectedNode)) {
        setSelectedNode(null);
      }
      
      console.log('✅ Node deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete node:', error);
    } finally {
      pendingOperationsRef.current.delete(operationId);
    }
  };
  
  // Enhanced file upload handler
  const handleFileUploaded = async (uploadedFile) => {
    const operationId = 'file_upload_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      console.log('📁 App.jsx processing uploaded file:', uploadedFile);
      
      // Create the node with proper validation
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
      
      // Add to nodes if not already exists
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
  };
  
  // Other functions remain the same but with operation tracking...
  const deleteProject = async (projectId) => {
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
  };
  
  // Add this function to your App.jsx component (around line 600, near other handlers)
  const handleFilesSync = async (newFiles) => {
    const operationId = 'files_sync_' + Date.now();
    
    try {
      pendingOperationsRef.current.add(operationId);
      console.log('🔄 Processing synced files:', newFiles);
      
      // Add the synced files to the nodes array
      setNodes(prevNodes => {
        // Filter out any files that might already exist (shouldn't happen, but safe)
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
  };

  const renameProject = async (projectId, newName) => {
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
  };
  
  const moveProject = async (projectId, newClientId) => {
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
  };
  
  const duplicateProject = async (projectId) => {
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
  };
  
  const moveNode = async (nodeId, newParentId, newProjectId) => {
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
  };
  
  const duplicateNode = async (nodeId) => {
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
  };
  
  return (
    <ChakraProvider>
      <Flex h="100vh" direction="column">
        <Toolbar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        
        <Flex flex="1" overflow="hidden">
          <Sidebar 
            projects={projects}
            nodes={nodes}
            clients={clients}
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            createProject={createProject}
            createFolder={createFolder}
            createFile={createFile}
            renameNode={renameNode}
            deleteNode={deleteNode}
            deleteProject={deleteProject}
            renameProject={renameProject}
            moveProject={moveProject}
            duplicateProject={duplicateProject}
            moveNode={moveNode}
            duplicateNode={duplicateNode}
            setNodes={setNodes}
          />
          
          <Box flex="1" display="flex" flexDirection="column" overflow="auto">
            <Tabs 
              index={activeTab} 
              onChange={setActiveTab}
              flex="1" 
              display="flex" 
              flexDirection="column"
            >
              <TabList>
                <Tab>Files</Tab>
                <Tab>Code Runner</Tab>
                <Tab>Clients</Tab>
                <Tab>Data Preview</Tab>
              </TabList>
              
              <TabPanels flex="1" overflowY="auto">
                <TabPanel h="100%" p={0}>
                  <MainPanel 
                    selectedNode={selectedNode}
                    nodes={nodes}
                  />
                </TabPanel>
                
                <TabPanel h="100%">
                  <VStack spacing={4} align="stretch" h="100%">
                    {/* Sync Button Row */}
                    <Box p={4} borderBottom="1px" borderColor="gray.200" _dark={{ borderColor: "gray.700" }}>
                      <HStack justify="space-between" align="center">
                        <Text fontSize="lg" fontWeight="medium">Python Code Runner</Text>
                        <FileSyncButton
                          projectId={nodes.find(n => n.id === selectedNode)?.project_id || 
                                    nodes.find(n => n.id === selectedNode)?.projectId}
                          onFilesSync={handleFilesSync}
                          nodes={nodes}
                          currentProject={projects.find(p => 
                            p.id === (nodes.find(n => n.id === selectedNode)?.project_id || 
                                    nodes.find(n => n.id === selectedNode)?.projectId)
                          )}
                        />
                      </HStack>
                    </Box>
                    
                    {/* Code Runner Component */}
                    <Box flex="1" overflow="hidden">
                      <CodeRunner 
                        nodes={nodes}
                        selectedNode={selectedNode}
                        projects={projects}
                      />
                    </Box>
                  </VStack>
                </TabPanel>
                
                <TabPanel h="100%">
                  <ClientManager 
                    clients={clients}
                    projects={projects}
                    nodes={nodes}
                    setClients={setClients}
                    createProject={createProject}
                  />
                </TabPanel>
                
                <TabPanel h="100%">
                  <DataFilePreview 
                    node={nodes.find(n => n.id === selectedNode)}
                    projectId={nodes.find(n => n.id === selectedNode)?.project_id}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </Flex>
      </Flex>
    </ChakraProvider>
  );
}

export default App;