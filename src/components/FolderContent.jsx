// src/components/FolderContent.jsx
import { Box, Table, Thead, Tbody, Tr, Th, Td, Icon, Text, Flex } from '@chakra-ui/react';
import { 
  FiFolder,
  FiFile,
  FiCode,
  FiFileText,
  FiBook,
} from 'react-icons/fi';

const FolderContent = ({ folderId, nodes }) => {
  // Handle both parentId and parent_id formats
  const children = nodes.filter(node => 
    node.parentId === folderId || node.parent_id === folderId
  );
  
  const getNodeIcon = (node) => {
    if (node.type === 'folder') {
      return FiFolder;
    }
    
    if (node.extension) {
      const ext = node.extension.toLowerCase();
      if (ext === 'py') return FiCode;
      if (ext === 'ipynb') return FiBook;
      if (['txt', 'md'].includes(ext)) return FiFileText;
    }
    
    return FiFile;
  };
  
  if (children.length === 0) {
    return (
      <Flex 
        justify="center" 
        align="center" 
        h="200px" 
        color="gray.500"
      >
        <Text>This folder is empty</Text>
      </Flex>
    );
  }
  
  return (
    <Box overflowX="auto">
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th>Last Modified</Th>
          </Tr>
        </Thead>
        <Tbody>
          {children
            .sort((a, b) => {
              // Sort folders first, then files
              if (a.type === 'folder' && b.type !== 'folder') return -1;
              if (a.type !== 'folder' && b.type === 'folder') return 1;
              // Then sort alphabetically
              return a.name.localeCompare(b.name);
            })
            .map(node => (
              <Tr key={node.id}>
                <Td>
                  <Flex align="center">
                    <Icon 
                      as={getNodeIcon(node)} 
                      mr={2} 
                      color={node.type === 'folder' ? 'yellow.500' : 'blue.500'} 
                    />
                    <Text>{node.name}</Text>
                  </Flex>
                </Td>
                <Td>
                  {node.type === 'folder' 
                    ? 'Folder' 
                    : node.extension 
                      ? `.${node.extension}` 
                      : 'File'
                  }
                </Td>
                <Td>-</Td>
              </Tr>
            ))
          }
        </Tbody>
      </Table>
    </Box>
  );
};

export default FolderContent;