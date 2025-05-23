// src/components/ClientManager.jsx - Enhanced with more distinct colors
import { useState } from 'react';
import {
  Box,
  Button,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
  Text,
  VStack,
  HStack,
  IconButton,
  useDisclosure,
  useToast,
  SimpleGrid,
  Circle,
} from '@chakra-ui/react';
import { FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';

// Enhanced color palette with better differentiation for sidebar use
const CLIENT_COLORS = [
  { name: 'Blue', value: 'blue.600', bg: 'blue.50', dark: 'blue.100', border: 'blue.300' },
  { name: 'Green', value: 'green.600', bg: 'green.50', dark: 'green.100', border: 'green.300' },
  { name: 'Purple', value: 'purple.600', bg: 'purple.50', dark: 'purple.100', border: 'purple.300' },
  { name: 'Orange', value: 'orange.600', bg: 'orange.50', dark: 'orange.100', border: 'orange.300' },
  { name: 'Pink', value: 'pink.600', bg: 'pink.50', dark: 'pink.100', border: 'pink.300' },
  { name: 'Teal', value: 'teal.600', bg: 'teal.50', dark: 'teal.100', border: 'teal.300' },
  { name: 'Red', value: 'red.600', bg: 'red.50', dark: 'red.100', border: 'red.300' },
  { name: 'Cyan', value: 'cyan.600', bg: 'cyan.50', dark: 'cyan.100', border: 'cyan.300' },
  { name: 'Yellow', value: 'yellow.600', bg: 'yellow.50', dark: 'yellow.100', border: 'yellow.300' },
  { name: 'Indigo', value: 'indigo.600', bg: 'indigo.50', dark: 'indigo.100', border: 'indigo.300' },
  { name: 'Emerald', value: 'green.700', bg: 'green.50', dark: 'green.100', border: 'green.400' },
  { name: 'Rose', value: 'pink.700', bg: 'pink.50', dark: 'pink.100', border: 'pink.400' },
];

const ClientManager = ({ clients, projects, nodes, setClients, createProject }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newClientName, setNewClientName] = useState('');
  const [newClientColor, setNewClientColor] = useState(CLIENT_COLORS[0]);
  const [editClient, setEditClient] = useState(null);
  const toast = useToast();

  const handleCreateClient = () => {
    if (!newClientName.trim()) {
      toast({
        title: 'Client name required',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    const newClient = {
      id: uuidv4(),
      name: newClientName.trim(),
      projects: [],
      color: newClientColor,
    };

    console.log('➕ Creating new client:', newClient);
    setClients(prevClients => {
      const updated = [...prevClients, newClient];
      console.log('👥 Updated clients count:', updated.length);
      return updated;
    });
    
    setNewClientName('');
    setNewClientColor(CLIENT_COLORS[0]);
    onClose();

    toast({
      title: 'Client created',
      description: `Client "${newClientName}" has been created.`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleUpdateClient = () => {
    if (!editClient || !editClient.name.trim()) {
      toast({
        title: 'Client name required',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    console.log('✏️ Updating client:', editClient);
    setClients(prevClients => {
      const updated = prevClients.map(client => 
        client.id === editClient.id 
          ? { 
              ...client, 
              name: editClient.name.trim(),
              color: editClient.color || CLIENT_COLORS[0]
            } 
          : client
      );
      console.log('👥 Updated clients count:', updated.length);
      return updated;
    });

    setEditClient(null);

    toast({
      title: 'Client updated',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleDeleteClient = (clientId) => {
    console.log('🗑️ Attempting to delete client:', clientId);
    
    const clientProjects = projects.filter(p => 
      p.clientId === clientId || p.client_id === clientId
    );
    
    console.log('📋 Projects for this client:', clientProjects);
    
    if (clientProjects.length > 0) {
      toast({
        title: 'Cannot delete client',
        description: `This client has ${clientProjects.length} associated project(s). Delete the projects first.`,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    console.log('✅ No projects found, proceeding with client deletion');
    setClients(prevClients => {
      const updated = prevClients.filter(client => client.id !== clientId);
      console.log('👥 Updated clients count after deletion:', updated.length);
      return updated;
    });
    
    toast({
      title: 'Client deleted',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const startEdit = (client) => {
    setEditClient({ 
      ...client, 
      color: client.color || CLIENT_COLORS[0]
    });
  };

  // Helper function to get actual project count for a client
  const getClientProjectCount = (clientId) => {
    return projects.filter(p => 
      p.clientId === clientId || p.client_id === clientId
    ).length;
  };

  return (
    <Box p={6}>
      <Flex justify="space-between" align="center" mb={4}>
        <Text fontSize="lg" fontWeight="bold">Clients</Text>
        <Button leftIcon={<FiPlus />} size="sm" onClick={onOpen}>
          Add Client
        </Button>
      </Flex>

      <VStack align="stretch" spacing={3}>
        {clients.map(client => {
          const projectCount = getClientProjectCount(client.id);
          const clientColor = client.color || CLIENT_COLORS[0];
          
          return (
            <Box 
              key={client.id}
              p={4}
              borderWidth="2px"
              borderRadius="lg"
              borderColor={clientColor.value}
              bg={clientColor.bg}
              _dark={{ bg: clientColor.dark }}
              _hover={{ 
                shadow: 'lg',
                borderColor: clientColor.value,
                transform: 'translateY(-1px)',
                transition: 'all 0.2s'
              }}
              position="relative"
            >
              {/* Color stripe indicator */}
              <Box
                position="absolute"
                left="0"
                top="0"
                bottom="0"
                width="4px"
                bg={clientColor.value}
                borderRadius="2px 0 0 2px"
              />
              
              <Flex justify="space-between" align="center">
                <HStack spacing={3}>
                  <Circle size="16px" bg={clientColor.value} />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="semibold" fontSize="md">{client.name}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {projectCount} project{projectCount !== 1 ? 's' : ''}
                    </Text>
                  </VStack>
                </HStack>
                <HStack>
                  <IconButton
                    icon={<FiEdit />}
                    size="sm"
                    variant="ghost"
                    colorScheme={clientColor.name.toLowerCase()}
                    aria-label="Edit client"
                    onClick={() => startEdit(client)}
                  />
                  <IconButton
                    icon={<FiTrash2 />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    aria-label="Delete client"
                    onClick={() => handleDeleteClient(client.id)}
                  />
                </HStack>
              </Flex>
              
              {/* Show project types if any */}
              {projectCount > 0 && (
                <Box mt={2}>
                  <Text fontSize="xs" color="gray.500">
                    Python workflows, data processing, automation
                  </Text>
                </Box>
              )}
            </Box>
          );
        })}

        {clients.length === 0 && (
          <Box p={6} textAlign="center" color="gray.500" bg="gray.50" borderRadius="md">
            <Text fontSize="md" mb={2}>No clients yet</Text>
            <Text fontSize="sm">Add your first client to organize your Python projects and workflows.</Text>
          </Box>
        )}
      </VStack>

      {/* Add Client Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Client</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Input
                placeholder="Client Name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
              />
              
              <Box w="100%">
                <Text fontSize="sm" fontWeight="medium" mb={3}>
                  Choose Color Theme
                </Text>
                <SimpleGrid columns={4} spacing={3}>
                  {CLIENT_COLORS.map((color) => (
                    <Button
                      key={color.name}
                      size="sm"
                      variant={newClientColor.name === color.name ? "solid" : "outline"}
                      colorScheme={color.name.toLowerCase()}
                      onClick={() => setNewClientColor(color)}
                      leftIcon={<Circle size="10px" bg={color.value} />}
                      fontSize="xs"
                    >
                      {color.name}
                    </Button>
                  ))}
                </SimpleGrid>
                
                {/* Preview */}
                <Box mt={4} p={3} borderRadius="md" bg={newClientColor.bg} borderLeft="4px solid" borderLeftColor={newClientColor.value}>
                  <HStack>
                    <Circle size="12px" bg={newClientColor.value} />
                    <Text fontSize="sm" color={newClientColor.value} fontWeight="medium">
                      Preview: {newClientName || 'Client Name'}
                    </Text>
                  </HStack>
                </Box>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleCreateClient}>
              Add Client
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Client Modal */}
      <Modal isOpen={!!editClient} onClose={() => setEditClient(null)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Client</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editClient && (
              <VStack spacing={4}>
                <Input
                  placeholder="Client Name"
                  value={editClient.name}
                  onChange={(e) => setEditClient({ ...editClient, name: e.target.value })}
                />
                
                <Box w="100%">
                  <Text fontSize="sm" fontWeight="medium" mb={3}>
                    Choose Color Theme
                  </Text>
                  <SimpleGrid columns={4} spacing={3}>
                    {CLIENT_COLORS.map((color) => (
                      <Button
                        key={color.name}
                        size="sm"
                        variant={editClient.color?.name === color.name ? "solid" : "outline"}
                        colorScheme={color.name.toLowerCase()}
                        onClick={() => setEditClient({ ...editClient, color })}
                        leftIcon={<Circle size="10px" bg={color.value} />}
                        fontSize="xs"
                      >
                        {color.name}
                      </Button>
                    ))}
                  </SimpleGrid>
                  
                  {/* Preview */}
                  <Box mt={4} p={3} borderRadius="md" bg={editClient.color?.bg} borderLeft="4px solid" borderLeftColor={editClient.color?.value}>
                    <HStack>
                      <Circle size="12px" bg={editClient.color?.value} />
                      <Text fontSize="sm" color={editClient.color?.value} fontWeight="medium">
                        Preview: {editClient.name || 'Client Name'}
                      </Text>
                    </HStack>
                  </Box>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setEditClient(null)}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleUpdateClient}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default ClientManager;