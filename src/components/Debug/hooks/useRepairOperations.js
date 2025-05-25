// src/components/Debug/hooks/useRepairOperations.js - Project repair operations
import { useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import { invoke } from '@tauri-apps/api/tauri';
import { v4 as uuidv4 } from 'uuid';

export const useRepairOperations = ({ 
  projects, 
  nodes, 
  setProjects,
  setNodes 
}) => {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  /**
   * Create missing project root for a project
   */
  const createMissingRoot = useCallback(async (projectId) => {
    try {
      setLoading(true);
      console.log('🔧 REPAIR: Creating missing root for project:', projectId);

      // Create the hidden root folder via backend
      const rootId = await invoke('create_folder', {
        parentId: '',
        name: '__PROJECT_ROOT__',
        projectId
      });

      console.log('🔧 REPAIR: Created root folder with ID:', rootId);

      // Update the project to have the correct root_id
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId 
            ? { ...project, root_id: rootId, rootId: rootId }
            : project
        )
      );

      // Add the hidden root node and fix orphaned files in one operation
      setNodes(prevNodes => {
        console.log('🔧 REPAIR: Current nodes before repair:', prevNodes.length);
        
        // Check if root already exists
        const rootExists = prevNodes.some(n => n.id === rootId);
        
        let updatedNodes = [...prevNodes];
        
        // Add root if it doesn't exist
        if (!rootExists) {
          const newRootNode = {
            id: rootId,
            name: '__PROJECT_ROOT__',
            type: 'folder',
            parent_id: null,
            parentId: null,
            project_id: projectId,
            projectId: projectId,
            hidden: true,
            file_path: '',
            extension: null,
          };
          updatedNodes = [...updatedNodes, newRootNode];
          console.log('🔧 REPAIR: Added root node');
        }
        
        // Fix orphaned files by setting them as children of the root
        updatedNodes = updatedNodes.map(node => {
          // If this node belongs to our project and has no parent, make it a child of the root
          if ((node.project_id === projectId || node.projectId === projectId) && 
              (!node.parent_id && !node.parentId) && 
              !node.hidden && 
              node.id !== rootId) {
            console.log('🔧 REPAIR: Fixing orphaned node:', node.name);
            return {
              ...node,
              parent_id: rootId,
              parentId: rootId,
            };
          }
          return node;
        });
        
        console.log('🔧 REPAIR: Final nodes after repair:', updatedNodes.length);
        console.log('🔧 REPAIR: Project nodes:', updatedNodes.filter(n => 
          n.project_id === projectId || n.projectId === projectId
        ));
        
        return updatedNodes;
      });

      toast({
        title: 'Project root created',
        description: 'Missing project root has been created and orphaned files fixed',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      console.log('✅ REPAIR: Project root creation completed');
      
      // Force refresh the project tree to ensure UI is in sync
      setTimeout(() => {
        forceRefreshProject(projectId);
      }, 500);

    } catch (error) {
      console.error('❌ REPAIR: Failed to create project root:', error);
      toast({
        title: 'Repair failed',
        description: error.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [setProjects, setNodes, toast]);

  /**
   * Fix orphaned files by moving them to project root
   */
  const repairOrphanedFiles = useCallback(async (projectId) => {
    try {
      setLoading(true);
      console.log('🔧 REPAIR: Fixing orphaned files for project:', projectId);

      const project = projects.find(p => p.id === projectId);
      if (!project) {
        throw new Error('Project not found');
      }

      const rootId = project.root_id || project.rootId;
      if (!rootId) {
        throw new Error('Project has no root - create the root first');
      }

      // Find orphaned files (belong to project but have no parent)
      const orphanedFiles = nodes.filter(node => 
        (node.project_id === projectId || node.projectId === projectId) &&
        !node.parent_id && !node.parentId &&
        !node.hidden &&
        node.id !== rootId
      );

      if (orphanedFiles.length === 0) {
        toast({
          title: 'No orphaned files',
          description: 'All files are properly organized',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Move orphaned files to the project root
      setNodes(prevNodes => 
        prevNodes.map(node => {
          if (orphanedFiles.some(orphan => orphan.id === node.id)) {
            console.log('🔧 REPAIR: Moving orphaned file to root:', node.name);
            return {
              ...node,
              parent_id: rootId,
              parentId: rootId,
            };
          }
          return node;
        })
      );

      toast({
        title: 'Orphaned files fixed',
        description: `Moved ${orphanedFiles.length} orphaned file(s) to project root`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      console.log('✅ REPAIR: Orphaned files repair completed');

    } catch (error) {
      console.error('❌ REPAIR: Failed to fix orphaned files:', error);
      toast({
        title: 'Repair failed',
        description: error.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [projects, nodes, setNodes, toast]);

  /**
   * Rebuild entire project tree from disk
   */
  const rebuildProjectTree = useCallback(async (projectId) => {
    try {
      setLoading(true);
      console.log('🔨 REPAIR: Rebuilding project tree for:', projectId);

      // Call backend to rebuild the project tree
      const rebuiltFiles = await invoke('rebuild_project_tree', {
        projectId,
      });

      console.log('🔨 REPAIR: Rebuild completed, got files:', rebuiltFiles);

      if (rebuiltFiles.length > 0) {
        // Remove old nodes for this project and replace with rebuilt ones
        setNodes(prevNodes => {
          const otherProjectNodes = prevNodes.filter(node => 
            node.project_id !== projectId && node.projectId !== projectId
          );

          const processedFiles = rebuiltFiles.map(file => ({
            ...file,
            id: file.id || file.node_id,
            project_id: file.project_id || file.projectId || projectId,
            projectId: file.project_id || file.projectId || projectId,
            parent_id: file.parent_id || file.parentId,
            parentId: file.parent_id || file.parentId,
            file_path: file.file_path || file.name,
            hidden: file.hidden || false,
          }));

          return [...otherProjectNodes, ...processedFiles];
        });

        // Update project root_id if we found a new root
        const newRoot = rebuiltFiles.find(f => f.hidden && f.name === '__PROJECT_ROOT__');
        if (newRoot) {
          setProjects(prevProjects => 
            prevProjects.map(project => 
              project.id === projectId 
                ? { ...project, root_id: newRoot.id, rootId: newRoot.id }
                : project
            )
          );
        }

        toast({
          title: 'Project tree rebuilt',
          description: `Rebuilt project with ${rebuiltFiles.length} file(s) and folder(s)`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Rebuild completed',
          description: 'No files found on disk for this project',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }

      console.log('✅ REPAIR: Project tree rebuild completed');

    } catch (error) {
      console.error('❌ REPAIR: Failed to rebuild project tree:', error);
      toast({
        title: 'Rebuild failed',
        description: error.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [setNodes, setProjects, toast]);

  /**
   * Force refresh project tree from backend after repairs
   */
  const forceRefreshProject = useCallback(async (projectId) => {
    try {
      console.log('🔄 REFRESH: Force refreshing project tree for:', projectId);
      
      // Call backend to get current project structure
      const currentFiles = await invoke('rebuild_project_tree', {
        projectId,
      });

      console.log('🔄 REFRESH: Got current files from backend:', currentFiles);

      if (currentFiles.length > 0) {
        // Remove old nodes for this project and replace with current ones
        setNodes(prevNodes => {
          const otherProjectNodes = prevNodes.filter(node => 
            node.project_id !== projectId && node.projectId !== projectId
          );

          const processedFiles = currentFiles.map(file => ({
            ...file,
            id: file.id || file.node_id,
            project_id: file.project_id || file.projectId || projectId,
            projectId: file.project_id || file.projectId || projectId,
            parent_id: file.parent_id || file.parentId,
            parentId: file.parent_id || file.parentId,
            file_path: file.file_path || file.name,
            hidden: file.hidden || false,
          }));

          console.log('🔄 REFRESH: Replacing project nodes with:', processedFiles.length, 'items');
          return [...otherProjectNodes, ...processedFiles];
        });

        // Update project root_id if we found a new root
        const newRoot = currentFiles.find(f => f.hidden && f.name === '__PROJECT_ROOT__');
        if (newRoot) {
          setProjects(prevProjects => 
            prevProjects.map(project => 
              project.id === projectId 
                ? { ...project, root_id: newRoot.id, rootId: newRoot.id }
                : project
            )
          );
        }
      }

    } catch (error) {
      console.error('❌ REFRESH: Failed to refresh project:', error);
    }
  }, [setNodes, setProjects]);

  return {
    loading,
    createMissingRoot,
    repairOrphanedFiles,
    rebuildProjectTree,
    forceRefreshProject, // Export the new function
  };
};