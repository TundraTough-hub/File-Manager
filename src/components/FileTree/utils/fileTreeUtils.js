// src/components/FileTree/utils/fileTreeUtils.js
import { useCallback } from 'react';
import { 
  FiFolder, 
  FiFile, 
  FiCode,
  FiFileText,
  FiBook,
  FiDatabase,
  FiImage,
  FiGlobe,
  FiGrid,
} from 'react-icons/fi';

export const useFileTreeUtils = () => {
  const getNodeIcon = useCallback((node) => {
    if (node.type === 'folder') {
      return FiFolder;
    }
    
    if (node.extension) {
      const ext = node.extension.toLowerCase();
      if (ext === 'py') return FiCode;
      if (ext === 'ipynb') return FiBook;
      if (ext === 'txt' || ext === 'md') return FiFileText;
      if (ext === 'json' || ext === 'csv') return FiDatabase;
      if (['jpg', 'png', 'gif', 'svg'].includes(ext)) return FiImage;
      if (['html', 'css', 'js'].includes(ext)) return FiGlobe;
      if (['xlsx', 'xls'].includes(ext)) return FiGrid;
    }
    
    return FiFile;
  }, []);
  
  const getIconColor = useCallback((node) => {
    if (node.type === 'folder') {
      return 'yellow.500';
    }
    
    if (node.extension) {
      const ext = node.extension.toLowerCase();
      if (ext === 'py') return 'blue.500';
      if (ext === 'ipynb') return 'purple.500';
      if (['jpg', 'png', 'gif', 'svg'].includes(ext)) return 'pink.500';
      if (['html', 'css', 'js'].includes(ext)) return 'orange.500';
      if (['json', 'csv'].includes(ext)) return 'green.500';
    }
    
    return 'blue.500';
  }, []);

  const getMoveDestinations = useCallback((nodeToMove, nodes, projectId, projects) => {
    const destinations = [];
    
    if (!nodeToMove) {
      return destinations;
    }
    
    // Get visible folders in current project (excluding the item being moved)
    const projectFolders = nodes.filter(n => 
      n.type === 'folder' && 
      (n.project_id === projectId || n.projectId === projectId) &&
      n.id !== nodeToMove.id &&
      !n.hidden &&
      n.name !== '__PROJECT_ROOT__'
    );
    
    // Find the hidden root for this project
    const hiddenRoot = nodes.find(n => 
      (n.name === '__PROJECT_ROOT__' || n.hidden) && 
      (n.project_id === projectId || n.projectId === projectId)
    );
    
    // Get current project name
    const currentProject = projects.find(p => p.id === projectId);
    
    // Add current project root level
    if (hiddenRoot && currentProject) {
      destinations.push({
        id: hiddenRoot.id,
        name: `📋 ${currentProject.name}`,
        projectId: projectId,
        projectName: 'Current Project',
        isProjectRoot: true
      });
    }
    
    // Add visible folders in current project
    projectFolders.forEach(folder => {
      destinations.push({
        id: folder.id,
        name: `📁 ${folder.name}`,
        projectId: projectId,
        projectName: 'Current Project',
        isProjectRoot: false
      });
    });
    
    // Add other projects
    projects.forEach(project => {
      if (project.id !== projectId) {
        const otherProjectRoot = nodes.find(n => 
          (n.name === '__PROJECT_ROOT__' || n.hidden) && 
          (n.project_id === project.id || n.projectId === project.id)
        );
        
        // Add other project root level
        if (otherProjectRoot) {
          destinations.push({
            id: otherProjectRoot.id,
            name: `📋 ${project.name}`,
            projectId: project.id,
            projectName: project.name,
            isProjectRoot: true
          });
        }
        
        // Add visible folders from other projects
        const otherProjectFolders = nodes.filter(n => 
          n.type === 'folder' && 
          (n.project_id === project.id || n.projectId === project.id) &&
          !n.hidden &&
          n.name !== '__PROJECT_ROOT__'
        );
        
        otherProjectFolders.forEach(folder => {
          destinations.push({
            id: folder.id,
            name: `📁 ${folder.name}`,
            projectId: project.id,
            projectName: project.name,
            isProjectRoot: false
          });
        });
      }
    });
    
    return destinations;
  }, []);

  const debugRootNode = useCallback((nodeId, rootId, nodes, projectId) => {
    // Only log once per actual render cycle to prevent infinite logging
    const debugKey = `${nodeId}-${nodes.length}-${projectId}`;
    if (!debugRootNode._lastDebugKey || debugRootNode._lastDebugKey !== debugKey) {
      debugRootNode._lastDebugKey = debugKey;
      
      console.log('🌳 DEBUG: ==========================================');
      console.log('🌳 DEBUG: Rendering ROOT node:', nodeId);
      console.log('🌳 DEBUG: Root node found:', !!nodes.find(n => n.id === nodeId));
      console.log('🌳 DEBUG: Total nodes:', nodes.length);
      console.log('🌳 DEBUG: Project ID:', projectId);
      
      // Show all nodes for this project
      const projectNodes = nodes.filter(n => 
        n.project_id === projectId || n.projectId === projectId
      );
      console.log('🌳 DEBUG: Project nodes count:', projectNodes.length);
      
      // Show children of the root node (should include uploaded files)
      const rootChildren = nodes.filter(n => 
        (n.parent_id === nodeId || n.parentId === nodeId) &&
        (n.project_id === projectId || n.projectId === projectId)
      );
      console.log('🌳 DEBUG: Direct children of root:', rootChildren.length);
      console.log('🌳 DEBUG: Root children details:', rootChildren.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        parent_id: c.parent_id,
        parentId: c.parentId,
        hidden: c.hidden
      })));
      
      // Check for uploaded files
      const uploadedFile = nodes.find(n => n.name.includes('Test Word Doc'));
      if (uploadedFile) {
        console.log('🌳 DEBUG: Found uploaded file:', uploadedFile);
        console.log('🌳 DEBUG: Uploaded file parent_id:', uploadedFile.parent_id);
        console.log('🌳 DEBUG: Uploaded file parentId:', uploadedFile.parentId);
        console.log('🌳 DEBUG: Does parent match root?', 
          uploadedFile.parent_id === nodeId || uploadedFile.parentId === nodeId);
      }
      
      console.log('🌳 DEBUG: ==========================================');
    }
  }, []);

  return {
    getNodeIcon,
    getIconColor,
    getMoveDestinations,
    debugRootNode,
  };
};