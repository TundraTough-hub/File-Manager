// src/components/MainPanel.jsx
import { Box, Flex, Heading, Text, Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';
import FileEditor from './FileEditor';
import FileDetails from './FileDetails';
import FolderContent from './FolderContent';

const MainPanel = ({ selectedNode, nodes }) => {
  const node = nodes.find(n => n.id === selectedNode);
  
  return (
    <Box flex="1" p={6}>
      {node ? (
        <Flex direction="column" h="100%">
          <Heading size="md" mb={4}>{node.name}</Heading>
          
          {node.type === 'folder' ? (
            <FolderContent 
              folderId={node.id}
              nodes={nodes}
            />
          ) : (
            <Tabs isFitted variant="enclosed" flex="1" display="flex" flexDirection="column">
              <TabList>
                <Tab>Edit</Tab>
                <Tab>Details</Tab>
              </TabList>
              
              <TabPanels flex="1" overflowY="auto">
                <TabPanel h="100%">
                  <FileEditor nodeId={node.id} />
                </TabPanel>
                <TabPanel>
                  <FileDetails node={node} />
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}
        </Flex>
      ) : (
        <Flex 
          direction="column" 
          align="center" 
          justify="center" 
          h="100%" 
          color="gray.500"
        >
          <Text fontSize="lg">Select a file or folder from the sidebar</Text>
        </Flex>
      )}
    </Box>
  );
};

export default MainPanel;