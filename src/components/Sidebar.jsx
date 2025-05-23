// src/components/Sidebar.jsx - Enhanced with FileTemplates and ProjectTemplates
import { useState } from 'react';
import { 
  Box, 
  VStack, 
  Text, 
  Menu, 
  MenuButton, 
  MenuList, 
  MenuItem, 
  MenuDivider,
  Button, 
  Input, 
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Select,
  HStack,
  Divider,
  IconButton,
  Flex,
  useColorModeValue,
  useToast,
  Circle,
  Badge,
} from '@chakra-ui/react';
import { 
  FiPlus, 
  FiFolder, 
  FiFile, 
  FiEdit, 
  FiTrash2, 
  FiChevronDown,
  FiMoreVertical,
  FiBriefcase,
  FiUser,
  FiZap,
} from 'react-icons/fi';
import EnhancedFileTree from './EnhancedFileTree';
import FileTemplates from './FileTemplates';
import { QuickProjectButton } from './ProjectTemplates';

const Sidebar = ({ 
  projects, 
  nodes, 
  clients,
  selectedNode,
  setSelectedNode,
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
  setNodes
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [nodeToDelete, setNodeToDelete] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [projectToRename, setProjectToRename] = useState(null);
  const [renameProjectName, setRenameProjectName] = useState('');
  const [projectToMove, setProjectToMove] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const toast = useToast();
  
  const { 
    isOpen: isNewProjectOpen, 
    onOpen: onNewProjectOpen, 
    onClose: onNewProjectClose 
  } = useDisclosure();
  
  const { 
    isOpen: isDeleteNodeOpen, 
    onOpen: onDeleteNodeOpen, 
    onClose: onDeleteNodeClose 
  } = useDisclosure();
  
  const { 
    isOpen: isDeleteProjectOpen, 
    onOpen: onDeleteProjectOpen, 
    onClose: onDeleteProjectClose 
  } = useDisclosure();
  
  const { 
    isOpen: isRenameProjectOpen, 
    onOpen: onRenameProjectOpen, 
    onClose: onRenameProjectClose 
  } = useDisclosure();
  
  const { 
    isOpen: isMoveProjectOpen, 
    onOpen: onMoveProjectOpen, 
    onClose: onMoveProjectClose 
  } = useDisclosure();
  
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Personal projects color scheme (grey)
  const personalProjectColor = {
    name: 'Gray',
    value: 'gray.500',
    bg: 'gray.50',
    dark: 'gray.100',
    border: 'gray.300'
  };

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      createProject(newProjectName.trim(), selectedClient);
      setNewProjectName('');
      setSelectedClient(null);
      onNewProjectClose();
    }
  };

  const handleDeleteNode = () => {
    if (nodeToDelete) {
      deleteNode(nodeToDelete);
      setNodeToDelete(null);
      onDeleteNodeClose();
    }
  };
  
  const handleDeleteProject = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete);
      setProjectToDelete(null);
      onDeleteProjectClose();
    }
  };

  const handleRenameProject = () => {
    if (!renameProjectName.trim()) {
      toast({
        title: 'Project name required',
        status: 'error',
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    if (projectToRename && renameProject) {
      renameProject(projectToRename.id, renameProjectName.trim());
      setProjectToRename(null);
      setRenameProjectName('');
      onRenameProjectClose();
      
      toast({
        title: 'Project renamed',
        description: `Project renamed to "${renameProjectName.trim()}"`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleMoveProject = (targetClientId) => {
    if (projectToMove && moveProject) {
      const targetClientName = targetClientId 
        ? clients.find(c => c.id === targetClientId)?.name 
        : 'Personal Projects';
      
      moveProject(projectToMove.id, targetClientId);
      setProjectToMove(null);
      onMoveProjectClose();
      
      toast({
        title: 'Project moved',
        description: `Project moved to ${targetClientName}`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const handleDuplicateProject = async (project) => {
    try {
      await duplicateProject(project.id);
      toast({
        title: 'Project duplicated',
        description: `Created "${project.name} (Copy)"`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Failed to duplicate project',
        description: error.toString(),
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const confirmDeleteNode = (nodeId) => {
    setNodeToDelete(nodeId);
    onDeleteNodeOpen();
  };
  
  const confirmDeleteProject = (projectId) => {
    setProjectToDelete(projectId);
    onDeleteProjectOpen();
  };
  
  const startRenameProject = (project) => {
    setProjectToRename(project);
    setRenameProjectName(project.name);
    onRenameProjectOpen();
  };
  
  const startMoveProject = (project) => {
    setProjectToMove(project);
    onMoveProjectOpen();
  };
  
  // Group projects by client
  const projectsByClient = {};
  
  projectsByClient["none"] = projects.filter(p => 
    (!p.clientId && !p.client_id) || 
    (p.clientId === null && p.client_id === null)
  );
  
  clients.forEach(client => {
    projectsByClient[client.id] = projects.filter(p => 
      p.clientId === client.id || p.client_id === client.id
    );
  });

  return (
    <Box 
      w="280px" 
      borderRight="1px" 
      borderColor={borderColor} 
      h="100%" 
      overflowY="auto"
    >
      <VStack align="stretch" spacing={0}>
        {/* Enhanced Header with Quick Project Button */}
        <Flex 
          justify="space-between" 
          align="center" 
          p={4} 
          borderBottom="1px" 
          borderColor={borderColor}
          gap={2}
        >
          <Text fontWeight="bold">Projects</Text>
          <HStack spacing={2}>
            <Button 
              leftIcon={<FiPlus />} 
              size="sm" 
              colorScheme="blue"
              onClick={onNewProjectOpen}
            >
              New
            </Button>
            <QuickProjectButton 
              onCreateProject={createProject} 
              clients={clients} 
            />
          </HStack>
        </Flex>
        
        <Accordion defaultIndex={[0]} allowMultiple>
          {/* Personal Projects with grey color */}
          {projectsByClient["none"].length > 0 && (
            <AccordionItem border="0">
              <AccordionButton 
                py={3} 
                px={4}
                bg={personalProjectColor.bg}
                _dark={{ bg: personalProjectColor.dark }}
                borderLeft="4px solid"
                borderLeftColor={personalProjectColor.value}
                _hover={{ 
                  bg: personalProjectColor.dark,
                  _dark: { bg: 'gray.200' }
                }}
              >
                <HStack flex="1" textAlign="left">
                  <Circle size="12px" bg={personalProjectColor.value} />
                  <Box as={FiUser} color={personalProjectColor.value} />
                  <Text fontWeight="semibold" color={personalProjectColor.value}>
                    Personal Projects
                  </Text>
                  <Badge 
                    size="sm" 
                    colorScheme="gray"
                    variant="solid"
                  >
                    {projectsByClient["none"].length}
                  </Badge>
                </HStack>
                <AccordionIcon color={personalProjectColor.value} />
              </AccordionButton>
              <AccordionPanel p={0}>
                {projectsByClient["none"].map(project => (
                  <ProjectItem
                    key={project.id}
                    project={project}
                    nodes={nodes}
                    selectedNode={selectedNode}
                    setSelectedNode={setSelectedNode}
                    createFolder={createFolder}
                    createFile={createFile}
                    renameNode={renameNode}
                    confirmDeleteNode={confirmDeleteNode}
                    confirmDeleteProject={confirmDeleteProject}
                    startRenameProject={startRenameProject}
                    startMoveProject={startMoveProject}
                    handleDuplicateProject={handleDuplicateProject}
                    moveNode={moveNode}
                    duplicateNode={duplicateNode}
                    projects={projects}
                    setNodes={setNodes}
                    clientColor={personalProjectColor}
                  />
                ))}
              </AccordionPanel>
            </AccordionItem>
          )}
          
          {/* Client projects with distinct colors */}
          {clients.map(client => {
            const clientProjects = projectsByClient[client.id] || [];
            if (clientProjects.length === 0) return null;
            
            const clientColor = client.color || {
              name: 'Blue',
              value: 'blue.500',
              bg: 'blue.50',
              dark: 'blue.100',
              border: 'blue.300'
            };
            
            return (
              <AccordionItem key={client.id} border="0">
                <AccordionButton 
                  py={3} 
                  px={4}
                  bg={clientColor.bg}
                  _dark={{ bg: clientColor.dark }}
                  borderLeft="4px solid"
                  borderLeftColor={clientColor.value}
                  _hover={{ 
                    bg: clientColor.dark,
                    _dark: { bg: `${clientColor.value.split('.')[0]}.200` }
                  }}
                >
                  <HStack flex="1" textAlign="left">
                    <Circle size="12px" bg={clientColor.value} />
                    <Box as={FiBriefcase} color={clientColor.value} />
                    <Text fontWeight="semibold" color={clientColor.value}>
                      {client.name}
                    </Text>
                    <Badge 
                      size="sm" 
                      colorScheme={clientColor.name.toLowerCase()}
                      variant="solid"
                    >
                      {clientProjects.length}
                    </Badge>
                  </HStack>
                  <AccordionIcon color={clientColor.value} />
                </AccordionButton>
                <AccordionPanel p={0}>
                  {clientProjects.map(project => (
                    <ProjectItem
                      key={project.id}
                      project={project}
                      nodes={nodes}
                      selectedNode={selectedNode}
                      setSelectedNode={setSelectedNode}
                      createFolder={createFolder}
                      createFile={createFile}
                      renameNode={renameNode}
                      confirmDeleteNode={confirmDeleteNode}
                      confirmDeleteProject={confirmDeleteProject}
                      startRenameProject={startRenameProject}
                      startMoveProject={startMoveProject}
                      handleDuplicateProject={handleDuplicateProject}
                      moveNode={moveNode}
                      duplicateNode={duplicateNode}
                      projects={projects}
                      setNodes={setNodes}
                      clientColor={clientColor}
                    />
                  ))}
                </AccordionPanel>
              </AccordionItem>
            );
          })}
        </Accordion>
        
        {projects.length === 0 && (
          <Box p={4} textAlign="center" color="gray.500">
            <VStack spacing={3}>
              <Text>No projects yet</Text>
              <Text fontSize="sm">Create a new project or use a template to get started.</Text>
              <QuickProjectButton 
                onCreateProject={createProject} 
                clients={clients} 
              />
            </VStack>
          </Box>
        )}
      </VStack>
      
      {/* All existing modals remain the same */}
      <Modal isOpen={isNewProjectOpen} onClose={onNewProjectClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Project</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Input
                placeholder="Project Name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
              
              <Select
                placeholder="Select Client (Optional)"
                value={selectedClient || ""}
                onChange={(e) => setSelectedClient(e.target.value || null)}
              >
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onNewProjectClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleCreateProject}>
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      <Modal isOpen={isRenameProjectOpen} onClose={onRenameProjectClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Rename Project</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              placeholder="Project Name"
              value={renameProjectName}
              onChange={(e) => setRenameProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameProject();
                }
              }}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRenameProjectClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleRenameProject}>
              Rename
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      <Modal isOpen={isMoveProjectOpen} onClose={onMoveProjectClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Move Project</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                Move "{projectToMove?.name}" to:
              </Text>
              
              <Button
                variant="outline"
                justifyContent="flex-start"
                leftIcon={<Circle size="8px" bg={personalProjectColor.value} />}
                onClick={() => handleMoveProject(null)}
                isDisabled={!projectToMove?.client_id && !projectToMove?.clientId}
              >
                📁 Personal Projects
              </Button>
              
              {clients.map(client => (
                <Button
                  key={client.id}
                  variant="outline"
                  justifyContent="flex-start"
                  leftIcon={<Circle size="8px" bg={client.color?.value || 'blue.500'} />}
                  onClick={() => handleMoveProject(client.id)}
                  isDisabled={
                    (projectToMove?.client_id === client.id) || 
                    (projectToMove?.clientId === client.id)
                  }
                >
                  {client.name}
                </Button>
              ))}
              
              {clients.length === 0 && (
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  No clients available. Create a client first to move projects there.
                </Text>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onMoveProjectClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      <Modal isOpen={isDeleteNodeOpen} onClose={onDeleteNodeClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Delete</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to delete this item? 
            This will delete all child items and cannot be undone.
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteNodeClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDeleteNode}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      <Modal isOpen={isDeleteProjectOpen} onClose={onDeleteProjectClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Project</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to delete this entire project? 
            This will delete all files and folders in the project and cannot be undone.
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteProjectClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleDeleteProject}>
              Delete Project
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

// Enhanced Project Item Component with FileTemplates integration
const ProjectItem = ({
  project,
  nodes,
  selectedNode,
  setSelectedNode,
  createFolder,
  createFile,
  renameNode,
  confirmDeleteNode,
  confirmDeleteProject,
  startRenameProject,
  startMoveProject,
  handleDuplicateProject,
  moveNode,
  duplicateNode,
  projects,
  setNodes,
  clientColor,
}) => {
  const rootNodeId = project.rootId || project.root_id;
  const rootNode = nodes.find(node => node.id === rootNodeId);
  
  if (!rootNode) return null;
  
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const visibleChildren = nodes.filter(node => 
    (node.project_id === project.id || node.projectId === project.id) &&
    !node.hidden &&
    node.name !== '__PROJECT_ROOT__'
  );
  
  const hasVisibleContent = visibleChildren.length > 0;
  
  const handleCreateFolder = async () => {
    await createFolder(rootNodeId, 'New Folder', project.id, true);
  };
  
  const handleCreateFile = async () => {
    await createFile(rootNodeId, 'New File.txt', project.id, true);
  };
  
  return (
    <Box 
      borderBottom="1px" 
      borderColor={borderColor}
      borderLeft="3px solid"
      borderLeftColor={clientColor?.value || 'gray.300'}
    >
      <Flex 
        justify="space-between" 
        align="center" 
        px={4} 
        py={2} 
        bg={clientColor?.bg || 'gray.50'}
        _dark={{ bg: clientColor?.dark || 'gray.700' }}
        _hover={{
          bg: clientColor?.dark || 'gray.100',
          _dark: { bg: `${clientColor?.value?.split('.')[0] || 'gray'}.200` }
        }}
      >
        <HStack>
          <Circle size="8px" bg={clientColor?.value || 'gray.500'} />
          <Text fontWeight="medium" color={clientColor?.value || 'gray.700'}>
            {project.name}
          </Text>
        </HStack>
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<FiMoreVertical />}
            variant="ghost"
            size="xs"
            color={clientColor?.value || 'gray.500'}
          />
          <MenuList>
            {/* Add FileTemplates at the top */}
            <Box px={2} py={1}>
              <FileTemplates 
                onCreateFile={createFile}
                currentFolderId={rootNodeId}
                projectId={project.id}
                isDisabled={false}
              />
            </Box>
            <MenuDivider />
            
            {/* Existing menu items */}
            <MenuItem 
              icon={<FiPlus />}
              onClick={() => handleCreateFolder()}
            >
              New Folder
            </MenuItem>
            <MenuItem 
              icon={<FiPlus />}
              onClick={() => handleCreateFile()}
            >
              New File
            </MenuItem>
            <MenuItem 
              icon={<FiEdit />}
              onClick={() => startRenameProject(project)}
            >
              Rename Project
            </MenuItem>
            <MenuItem 
              icon={<FiBriefcase />}
              onClick={() => startMoveProject(project)}
            >
              Move to Client
            </MenuItem>
            <MenuItem 
              icon={<FiFile />}
              onClick={() => handleDuplicateProject(project)}
            >
              Duplicate Project
            </MenuItem>
            <MenuItem 
              icon={<FiTrash2 />}
              color="red.500"
              onClick={() => confirmDeleteProject(project.id)}
            >
              Delete Project
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>
      
      {hasVisibleContent ? (
        <Box pl={2}>
          <EnhancedFileTree
            nodes={nodes}
            rootId={rootNodeId}
            projectId={project.id}
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            createFolder={createFolder}
            createFile={createFile}
            renameNode={renameNode}
            confirmDelete={confirmDeleteNode}
            moveNode={moveNode}
            duplicateNode={duplicateNode}
            projects={projects}
            setNodes={setNodes}
          />
        </Box>
      ) : (
        <Box 
          p={4} 
          bg={clientColor?.bg || 'gray.25'} 
          _dark={{ bg: clientColor?.dark || 'gray.750' }}
        >
          <VStack spacing={3}>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              This project is empty. Quick start:
            </Text>
            <VStack spacing={2} w="100%">
              <FileTemplates 
                onCreateFile={createFile}
                currentFolderId={rootNodeId}
                projectId={project.id}
                isDisabled={false}
              />
              <HStack spacing={2}>
                <Button 
                  leftIcon={<FiFolder />} 
                  size="sm" 
                  variant="outline"
                  colorScheme={clientColor?.name?.toLowerCase() || 'gray'}
                  onClick={handleCreateFolder}
                >
                  Add Folder
                </Button>
                <Button 
                  leftIcon={<FiFile />} 
                  size="sm" 
                  variant="outline"
                  colorScheme={clientColor?.name?.toLowerCase() || 'gray'}
                  onClick={handleCreateFile}
                >
                  Add File
                </Button>
              </HStack>
            </VStack>
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default Sidebar;