// src/hooks/utils/pathUtils.js
// Utility functions for building file paths in the node hierarchy

/**
 * Builds the relative path for a node based on its hierarchy
 * @param {string} parentId - The parent node ID
 * @param {string} name - The node name
 * @param {string} projectId - The project ID
 * @param {Array} nodes - All nodes for hierarchy traversal
 * @returns {string} The relative path from project root
 */
export const buildNodePath = (parentId, name, projectId, nodes) => {
  if (!parentId) return name;
  
  // Find the parent node
  const parentNode = nodes.find(n => n.id === parentId);
  if (!parentNode || parentNode.hidden || parentNode.name === '__PROJECT_ROOT__') {
    return name;
  }
  
  // Recursively build the path
  const parentPath = buildNodePath(
    parentNode.parent_id || parentNode.parentId, 
    parentNode.name, 
    projectId,
    nodes
  );
  
  return parentPath ? `${parentPath}/${name}` : name;
};

/**
 * Validates that a name is safe for file system use
 * @param {string} name - The name to validate
 * @returns {Object} { isValid: boolean, error?: string }
 */
export const validateNodeName = (name) => {
  if (!name.trim()) {
    return { isValid: false, error: 'Name cannot be empty' };
  }
  
  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(name)) {
    return { isValid: false, error: 'Name contains invalid characters' };
  }
  
  // Check for reserved names
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  if (reservedNames.includes(name.toUpperCase())) {
    return { isValid: false, error: 'Name is reserved by the system' };
  }
  
  return { isValid: true };
};

/**
 * Generates a unique name by appending a number if conflicts exist
 * @param {string} baseName - The desired base name
 * @param {Array} existingNames - Array of existing names to check against
 * @returns {string} A unique name
 */
export const generateUniqueName = (baseName, existingNames) => {
  const lowerExistingNames = existingNames.map(name => name.toLowerCase());
  
  let finalName = baseName;
  let counter = 1;
  
  while (lowerExistingNames.includes(finalName.toLowerCase())) {
    if (baseName.includes('.')) {
      // Handle files with extensions
      const parts = baseName.split('.');
      const extension = parts.pop();
      const nameWithoutExt = parts.join('.');
      finalName = `${nameWithoutExt} (${counter}).${extension}`;
    } else {
      // Handle folders or files without extensions
      finalName = `${baseName} (${counter})`;
    }
    counter++;
  }
  
  return finalName;
};

/**
 * Extracts file extension from a filename
 * @param {string} fileName - The filename
 * @returns {string|null} The extension without the dot, or null if none
 */
export const extractFileExtension = (fileName) => {
  const parts = fileName.split('.');
  if (parts.length > 1) {
    return parts[parts.length - 1];
  }
  return null;
};

/**
 * Updates the paths of all descendant nodes when a parent is renamed or moved
 * @param {string} parentNodeId - The ID of the parent node
 * @param {Array} nodes - All nodes
 * @param {Function} updateNodePath - Function to update a single node's path
 */
export const updateDescendantPaths = (parentNodeId, nodes, updateNodePath) => {
  const children = nodes.filter(node => 
    (node.parent_id === parentNodeId || node.parentId === parentNodeId)
  );
  
  children.forEach(child => {
    // Update this child's path
    updateNodePath(child.id);
    
    // Recursively update its children if it's a folder
    if (child.type === 'folder') {
      updateDescendantPaths(child.id, nodes, updateNodePath);
    }
  });
};