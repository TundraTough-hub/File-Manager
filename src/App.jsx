// src/App.jsx - Refactored and simplified
import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { useAppState } from './hooks/useAppState';
import { useAppOperations } from './hooks/useAppOperations';
import MainLayout from './components/layout/MainLayout';

function App() {
  // Get app state from custom hook
  const {
    projects,
    nodes,
    clients,
    selectedNode,
    selectedProject,
    isLoaded,
    setProjects,
    setNodes,
    setClients,
    setSelectedNode,
    setSelectedProject,
    pendingOperationsRef,
    loadProjects,
    saveProjects,
  } = useAppState();

  // Get operations from custom hook
  const {
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
  } = useAppOperations({
    projects,
    nodes,
    clients,
    setProjects,
    setNodes,
    setClients,
    setSelectedNode,
    pendingOperationsRef,
  });

  return (
    <ChakraProvider>
      <MainLayout
        // State
        projects={projects}
        nodes={nodes}
        clients={clients}
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
        setClients={setClients}
        
        // Operations
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
        handleFilesSync={handleFilesSync}
      />
    </ChakraProvider>
  );
}

export default App;