// src/components/FileTree/utils/fileTreeUtils.js - CLEANED VERSION
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
    // CLEANED: Reduced debug logging to prevent console spam
    // Only log when there are actual issues or on first render
    const debugKey = `${nodeId}-${nodes.length}-${projectId}`;
    if (!debugRootNode._lastDebugKey || debugRootNode._lastDebugKey !== debugKey) {
      debugRootNode._lastDebugKey = debugKey;
      
      // Check if there are any uploaded files with wrong parent_id
      const uploadedFile = nodes.find(n => n.name.includes('Test Word Doc') || n.name.includes('uploaded'));
      if (uploadedFile && (uploadedFile.parent_id === null || uploadedFile.parent_id === undefined)) {
        console.log('🌳 ISSUE: Found uploaded file with null parent_id:', uploadedFile);
        console.log('🌳 ISSUE: Expected parent should be:', nodeId);
      } else if (uploadedFile) {
        console.log('✅ FIXED: Uploaded file has proper parent_id:', uploadedFile.parent_id);
      }
    }
  }, []);

  return {
    getNodeIcon,
    getIconColor,
    getMoveDestinations,
    debugRootNode,
  };
};