// src/components/sidebar/EmptyProjectsState.jsx
// Component shown when no projects exist

import React from 'react';
import {
  Box,
  VStack,
  Text,
} from '@chakra-ui/react';
import { QuickProjectButton } from '../ProjectTemplates';

const EmptyProjectsState = ({ createProject, clients }) => {
  return (
    <Box p={4} textAlign="center" color="gray.500">
      <VStack spacing={3}>
        <Text>No projects yet</Text>
        <Text fontSize="sm">
          Create a new project or use a template to get started.
        </Text>
        <QuickProjectButton 
          onCreateProject={createProject} 
          clients={clients} 
        />
      </VStack>
    </Box>
  );
};

export default EmptyProjectsState;