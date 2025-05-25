// src/components/layout/MainLayout.jsx - FIXED: Accept state setters
import React, { useState } from 'react';
import { 
  Flex, 
  Box, 
  Tabs, 
  TabList, 
  Tab, 
  TabPanels, 
  TabPanel,
  VStack,
  HStack,
  Text,
  Switch,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import Toolbar from '../Toolbar';
import Sidebar from '../sidebar/Sidebar';
import MainPanel from '../MainPanel';
import ClientManager from '../ClientManager';
import CodeRunner from '../CodeRunner';
import DataFilePreview from '../DataFilePreview';
import FileSyncButton from '../FileSyncButton';
import DebugPanel from '../DebugPanel';

const MainLayout = ({
  // State
  projects,
  nodes,
  clients,
  selectedNode,
  setSelectedNode,
  setClients,
  
  // ADDED: State setters for debug panel
  setProjects,
  setNodes,
  
  // Operations
  createProject,
  createFolder,
  createFile,
  renameNode,
  deleteNode,
  deleteProject,
  renameProject,
  moveProject,
  duplicateProject,
  moveNode,
  duplicateNode,
  handleFilesSync,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [showDebugPanel, setShowDebugPanel] = useState(true); // Show by default for troubleshooting

  const selectedNodeData = nodes.find(n => n.id === selectedNode);
  const currentProjectId = selectedNodeData?.project_id || selectedNodeData?.projectId;

  return (
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
          {/* Debug Panel Toggle */}
          <Box p={2} borderBottom="1px" borderColor="gray.200" _dark={{ borderColor: "gray.700" }}>
            <FormControl display="flex" alignItems="center" w="auto">
              <FormLabel fontSize="sm" mb="0" mr={2}>Debug Panel:</FormLabel>
              <Switch 
                size="sm" 
                isChecked={showDebugPanel} 
                onChange={(e) => setShowDebugPanel(e.target.checked)} 
                colorScheme="orange"
              />
            </FormControl>
          </Box>

          {/* Debug Panel */}
          {showDebugPanel && (
            <Box p={4} borderBottom="1px" borderColor="gray.200" _dark={{ borderColor: "gray.700" }}>
              <DebugPanel
                projects={projects}
                nodes={nodes}
                clients={clients}
                selectedNode={selectedNode}
                projectId={currentProjectId}
                setProjects={setProjects}
                setNodes={setNodes}
              />
            </Box>
          )}
          
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
                        projectId={currentProjectId}
                        onFilesSync={handleFilesSync}
                        nodes={nodes}
                        currentProject={projects.find(p => p.id === currentProjectId)}
                      />
                    </HStack>
                  </Box>
                  
                  {/* Code Runner Component */}
                  <Box flex="1" overflow="hidden">
                    <CodeRunner 
                      nodes={nodes}
                      selectedNode={selectedNode}
                      projects={projects}
                      onFilesSync={handleFilesSync}
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
                  projectId={currentProjectId}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Flex>
    </Flex>
  );
};

export default MainLayout;