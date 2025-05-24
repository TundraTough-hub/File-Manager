// src/components/layout/MainLayout.jsx
// Main layout component that contains the toolbar and main content area

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
  Text
} from '@chakra-ui/react';
import Toolbar from '../Toolbar';
import Sidebar from '../sidebar/Sidebar';
import MainPanel from '../MainPanel';
import ClientManager from '../ClientManager';
import CodeRunner from '../CodeRunner';
import DataFilePreview from '../DataFilePreview';
import FileSyncButton from '../FileSyncButton';

const MainLayout = ({
  // State
  projects,
  nodes,
  clients,
  selectedNode,
  setSelectedNode,
  setClients,
  
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
  setNodes,
  handleFilesSync,
}) => {
  const [activeTab, setActiveTab] = useState(0);

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
  );
};

export default MainLayout;