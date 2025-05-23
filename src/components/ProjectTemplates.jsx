// src/components/ProjectTemplates.jsx
import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Icon,
  Box,
  useDisclosure,
  useToast,
  SimpleGrid,
  Badge,
} from '@chakra-ui/react';
import { 
  FiCode, 
  FiDatabase, 
  FiGlobe, 
  FiTrendingUp, 
  FiCpu,
  FiPlus,
  FiFolder,
  FiFile
} from 'react-icons/fi';
import { FILE_TEMPLATES } from './FileTemplates';

export const PROJECT_TEMPLATES = [
  {
    id: 'basic-python',
    name: 'Basic Python Project',
    description: 'Simple Python project with main script and requirements',
    icon: FiCode,
    color: 'blue.500',
    files: [
      { name: 'main.py', template: 'main-script' },
      { name: 'requirements.txt', template: 'requirements' },
      { name: 'README.md', template: 'readme' },
      { name: '.gitignore', template: 'gitignore' }
    ],
    folders: []
  },
  {
    id: 'data-science',
    name: 'Data Science Project',
    description: 'Complete data science project with notebooks and data folders',
    icon: FiTrendingUp,
    color: 'purple.500',
    files: [
      { name: 'main.py', template: 'main-script' },
      { name: 'requirements.txt', template: 'requirements' },
      { name: 'README.md', template: 'readme' },
      { name: 'config.json', template: 'config' },
      { name: '.gitignore', template: 'gitignore' },
      { name: 'notebooks/analysis.ipynb', template: 'jupyter-notebook' },
      { name: 'notebooks/data_exploration.ipynb', template: 'jupyter-notebook' }
    ],
    folders: [
      'data/raw',
      'data/processed',
      'notebooks',
      'src',
      'output',
      'logs'
    ]
  },
  {
    id: 'web-scraping',
    name: 'Web Scraping Project',
    description: 'Project for web scraping and data extraction',
    icon: FiGlobe,
    color: 'green.500',
    files: [
      { name: 'scraper.py', template: 'python-script' },
      { name: 'requirements.txt', template: 'requirements' },
      { name: 'README.md', template: 'readme' },
      { name: 'config.json', template: 'config' },
      { name: '.gitignore', template: 'gitignore' }
    ],
    folders: [
      'data',
      'output',
      'logs',
      'src'
    ]
  },
  {
    id: 'machine-learning',
    name: 'Machine Learning Project',
    description: 'ML project with model training and evaluation structure',
    icon: FiCpu,
    color: 'orange.500',
    files: [
      { name: 'train.py', template: 'python-script' },
      { name: 'predict.py', template: 'python-script' },
      { name: 'requirements.txt', template: 'requirements' },
      { name: 'README.md', template: 'readme' },
      { name: 'config.json', template: 'config' },
      { name: '.gitignore', template: 'gitignore' },
      { name: 'notebooks/model_training.ipynb', template: 'jupyter-notebook' },
      { name: 'notebooks/evaluation.ipynb', template: 'jupyter-notebook' }
    ],
    folders: [
      'data/raw',
      'data/processed',
      'models',
      'notebooks',
      'src',
      'tests',
      'output',
      'logs'
    ]
  },
  {
    id: 'api-project',
    name: 'API Development Project',
    description: 'REST API project with FastAPI or Flask structure',
    icon: FiDatabase,
    color: 'teal.500',
    files: [
      { name: 'app.py', template: 'python-script' },
      { name: 'main.py', template: 'main-script' },
      { name: 'requirements.txt', template: 'requirements' },
      { name: 'README.md', template: 'readme' },
      { name: 'config.json', template: 'config' },
      { name: '.gitignore', template: 'gitignore' }
    ],
    folders: [
      'src/routes',
      'src/models',
      'src/services',
      'tests',
      'docs',
      'logs'
    ]
  }
];

const ProjectTemplates = ({ 
  onCreateProject, 
  clients = [],
  isOpen,
  onClose 
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const toast = useToast();

  const handleCreateProject = async () => {
    if (!selectedTemplate) return;

    setIsCreating(true);
    try {
      // Create the project first
      const projectName = `${selectedTemplate.name} - ${new Date().toLocaleDateString()}`;
      const projectId = await onCreateProject(projectName, selectedClient);

      // TODO: After creating the project, you would need to:
      // 1. Create all the folders
      // 2. Create all the files with their templates
      // This would require additional Tauri commands or modifications to existing ones

      toast({
        title: 'Project created successfully',
        description: `${selectedTemplate.name} has been set up with all files and folders`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Reset and close
      setSelectedTemplate(null);
      setSelectedClient(null);
      onClose();

    } catch (error) {
      console.error('Failed to create project:', error);
      toast({
        title: 'Project creation failed',
        description: error.toString(),
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create Project from Template</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Template Selection */}
            <Box>
              <Text fontWeight="medium" mb={3}>Choose a Project Template</Text>
              <SimpleGrid columns={1} spacing={3}>
                {PROJECT_TEMPLATES.map((template) => (
                  <Box
                    key={template.id}
                    p={4}
                    borderWidth="2px"
                    borderRadius="lg"
                    borderColor={selectedTemplate?.id === template.id ? template.color : "gray.200"}
                    bg={selectedTemplate?.id === template.id ? `${template.color.split('.')[0]}.50` : "white"}
                    cursor="pointer"
                    onClick={() => setSelectedTemplate(template)}
                    _hover={{
                      borderColor: template.color,
                      shadow: "md"
                    }}
                    _dark={{
                      bg: selectedTemplate?.id === template.id ? `${template.color.split('.')[0]}.900` : "gray.700",
                      borderColor: selectedTemplate?.id === template.id ? template.color : "gray.600"
                    }}
                  >
                    <HStack spacing={3}>
                      <Icon as={template.icon} color={template.color} boxSize={6} />
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontWeight="semibold">{template.name}</Text>
                        <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }}>
                          {template.description}
                        </Text>
                        <HStack spacing={2} mt={2}>
                          <Badge leftIcon={<FiFile />} size="sm">
                            {template.files.length} files
                          </Badge>
                          <Badge leftIcon={<FiFolder />} size="sm" colorScheme="green">
                            {template.folders.length} folders
                          </Badge>
                        </HStack>
                      </VStack>
                    </HStack>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>

            {/* Template Details */}
            {selectedTemplate && (
              <Box p={4} bg="gray.50" borderRadius="md" _dark={{ bg: "gray.800" }}>
                <Text fontWeight="medium" mb={2}>Project Structure Preview</Text>
                <VStack align="start" spacing={1} fontSize="sm">
                  {selectedTemplate.folders.map((folder, index) => (
                    <HStack key={index} spacing={2}>
                      <Icon as={FiFolder} color="yellow.500" />
                      <Text>{folder}/</Text>
                    </HStack>
                  ))}
                  {selectedTemplate.files.map((file, index) => (
                    <HStack key={index} spacing={2}>
                      <Icon as={FiFile} color="blue.500" />
                      <Text>{file.name}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}

            {/* Client Selection */}
            {clients.length > 0 && (
              <Box>
                <Text fontWeight="medium" mb={3}>Assign to Client (Optional)</Text>
                <SimpleGrid columns={2} spacing={2}>
                  <Button
                    variant={selectedClient === null ? "solid" : "outline"}
                    onClick={() => setSelectedClient(null)}
                    size="sm"
                  >
                    Personal Project
                  </Button>
                  {clients.map((client) => (
                    <Button
                      key={client.id}
                      variant={selectedClient === client.id ? "solid" : "outline"}
                      onClick={() => setSelectedClient(client.id)}
                      size="sm"
                      colorScheme={client.color?.name?.toLowerCase() || "blue"}
                    >
                      {client.name}
                    </Button>
                  ))}
                </SimpleGrid>
              </Box>
            )}
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleCreateProject}
            isDisabled={!selectedTemplate}
            isLoading={isCreating}
            loadingText="Creating Project..."
          >
            Create Project
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Quick Project Creation Button Component
export const QuickProjectButton = ({ onCreateProject, clients = [] }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Button 
        leftIcon={<FiPlus />} 
        colorScheme="green" 
        size="sm"
        onClick={onOpen}
      >
        Quick Project
      </Button>
      <ProjectTemplates
        onCreateProject={onCreateProject}
        clients={clients}
        isOpen={isOpen}
        onClose={onClose}
      />
    </>
  );
};

export default ProjectTemplates;