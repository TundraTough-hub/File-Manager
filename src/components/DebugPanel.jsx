// src/components/DebugPanel.jsx - FIXED: With repair tools integration
import React, { useState, useEffect } from 'react';
import {
  VStack,
  HStack,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Alert,
  AlertIcon,
  Box,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { 
  FiInfo,
  FiSearch,
  FiTool,
  FiDatabase,
  FiSettings,
  FiFile, 
  FiFolder,
} from 'react-icons/fi';

// Import debug sub-components
import AppInfoPanel from './Debug/AppInfoPanel';
import ProjectAnalyzer from './Debug/ProjectAnalyzer';
import OrphanDetector from './Debug/OrphanDetector';
import RepairTools from './Debug/RepairTools';
import { useDebugOperations } from './Debug/hooks/useDebugOperations';
import { useRepairOperations } from './Debug/hooks/useRepairOperations';

// Add this import to DebugPanel.jsx
import ProjectDiagnostic from './Debug/ProjectDiagnostic';

// Simple fallback icon functions
const getFileIcon = (node) => {
  if (!node) return FiFile;
  return node.type === 'folder' ? FiFolder : FiFile;
};

const getFileIconColor = (node) => {
  if (!node) return 'gray.500';
  if (node.type === 'folder') return 'yellow.500';
  return 'blue.500';
};

const DebugPanel = ({ 
  projects = [], 
  nodes = [], 
  clients = [],
  onReloadApp,
  // Add these props to handle state updates
  setProjects,
  setNodes,
}) => {
  // Debug operations hook
  const {
    loading,
    debugInfo,
    getAppInfo,
    deleteOrphanedFiles,
    deleteUnassignedOrphans,
    rebuildProjectTree,
    copyToClipboard,
    findOrphanedFiles,
    findUnassignedOrphanedFiles,
    findProjectRoot,
    getAllOrphanedFiles,
  } = useDebugOperations({ projects, nodes, clients });

  // Repair operations hook
  const repairOperations = useRepairOperations({
    projects,
    nodes,
    setProjects,
    setNodes,
  });

  // State management
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  // Theme colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Auto-select first project if available
  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // Load app info on mount
  useEffect(() => {
    getAppInfo();
  }, [getAppInfo]);

  // Get current project data
  const currentProject = projects.find(p => p.id === selectedProjectId);
  const projectRoot = selectedProjectId ? findProjectRoot(selectedProjectId) : null;
  const orphanedFiles = selectedProjectId ? findOrphanedFiles(selectedProjectId) : [];
  const unassignedOrphanedFiles = findUnassignedOrphanedFiles();
  const allOrphanedFiles = getAllOrphanedFiles();

  // Calculate total issues for badges
  const totalOrphans = orphanedFiles.length + unassignedOrphanedFiles.length;
  const hasIssues = totalOrphans > 0 || !projectRoot;

  // Tab data with issue counts - INCLUDING REPAIR TOOLS
  const tabData = [
    {
      label: 'App Info',
      icon: FiDatabase,
      component: AppInfoPanel,
      props: {
        projects,
        nodes,
        clients,
        debugInfo,
        loading,
        onGetAppInfo: getAppInfo,
        onCopyToClipboard: copyToClipboard,
        onReloadApp,
        allOrphanedFiles,
      },
      badgeCount: null,
    },
    {
      label: 'Project Analysis',
      icon: FiSearch,
      component: ProjectAnalyzer,
      props: {
        projects,
        nodes,
        selectedProjectId,
        onProjectSelect: setSelectedProjectId,
        currentProject,
        projectRoot,
        orphanedFiles,
        getFileIcon,
        getFileIconColor,
      },
      badgeCount: hasIssues ? '!' : null,
      badgeColor: hasIssues ? 'red' : 'green',
    },
    {
      label: 'Orphan Detection',
      icon: FiTool,
      component: OrphanDetector,
      props: {
        currentProjectId: selectedProjectId,
        orphanedFiles,
        unassignedOrphanedFiles,
        projectRoot,
        getFileIcon,
        getFileIconColor,
        onDeleteOrphans: deleteOrphanedFiles,
        onDeleteUnassigned: deleteUnassignedOrphans,
        onRebuildProject: rebuildProjectTree,
        loading,
      },
      badgeCount: totalOrphans > 0 ? totalOrphans : null,
      badgeColor: totalOrphans > 0 ? 'red' : 'green',
    },
    // NEW: Repair Tools tab
    {
      label: 'Repair Tools',
      icon: FiSettings,
      component: RepairTools,
      props: {
        currentProject,
        projectRoot,
        orphanedFiles,
        onRepairProjectRoot: repairOperations.repairOrphanedFiles,
        onRebuildProject: repairOperations.rebuildProjectTree,
        onCreateMissingRoot: repairOperations.createMissingRoot,
        onForceRefresh: repairOperations.forceRefreshProject,
        loading: repairOperations.loading,
      },
      badgeCount: hasIssues ? 'Fix' : null,
      badgeColor: hasIssues ? 'red' : 'green',
    },

    {
      label: 'Diagnostic',
      icon: FiSearch,
      component: ProjectDiagnostic,
      props: {
        currentProject,
        nodes,
        onForceRebuild: repairOperations.rebuildProjectTree,
        loading: repairOperations.loading,
      },
      badgeCount: null,
    },

  ];

  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      p={4}
      h="full"
      overflow="hidden"
    >
      <VStack spacing={4} align="stretch" h="full">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack>
            <FiInfo />
            <Text fontSize="lg" fontWeight="bold">
              Debug Panel
            </Text>
            {hasIssues && (
              <Badge colorScheme="red" variant="solid">
                Issues Found
              </Badge>
            )}
          </HStack>
          
          {/* Quick stats */}
          <HStack spacing={2} wrap="wrap">
            <Badge colorScheme="blue" variant="outline">
              {projects.length} Projects
            </Badge>
            <Badge colorScheme="green" variant="outline">
              {nodes.length} Nodes
            </Badge>
            {totalOrphans > 0 && (
              <Badge colorScheme="red" variant="solid">
                {totalOrphans} Orphans
              </Badge>
            )}
          </HStack>
        </HStack>

        <Divider />

        {/* Main Content */}
        <Box flex="1" overflow="hidden">
          <Tabs 
            index={activeTab} 
            onChange={setActiveTab}
            variant="line"
            colorScheme="blue"
            h="full"
            display="flex"
            flexDirection="column"
          >
            {/* Tab List */}
            <TabList>
              {tabData.map((tab, index) => (
                <Tab key={index}>
                  <HStack spacing={2}>
                    <tab.icon size="16" />
                    <Text>{tab.label}</Text>
                    {tab.badgeCount && (
                      <Badge 
                        colorScheme={tab.badgeColor || 'gray'} 
                        variant="solid"
                        fontSize="xs"
                        minW="18px"
                        h="18px"
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        {tab.badgeCount}
                      </Badge>
                    )}
                  </HStack>
                </Tab>
              ))}
            </TabList>

            {/* Tab Panels */}
            <TabPanels flex="1" overflow="hidden">
              {tabData.map((tab, index) => (
                <TabPanel 
                  key={index} 
                  p={4} 
                  h="full" 
                  overflow="auto"
                >
                  <tab.component {...tab.props} />
                </TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </Box>

        {/* Footer Status */}
        <Box pt={2} borderTop="1px solid" borderColor={borderColor}>
          {(loading || repairOperations.loading) ? (
            <Alert status="info" size="sm">
              <AlertIcon />
              <Text fontSize="sm">
                {repairOperations.loading ? 'Repairing project...' : 'Processing debug operations...'}
              </Text>
            </Alert>
          ) : hasIssues ? (
            <Alert status="warning" size="sm">
              <AlertIcon />
              <VStack align="start" spacing={0} fontSize="sm">
                <Text fontWeight="medium">Issues detected in project structure</Text>
                <Text fontSize="xs" color="gray.600">
                  {totalOrphans > 0 && `${totalOrphans} orphaned files found. `}
                  {!projectRoot && currentProject && 'Missing project root. '}
                  Check the Repair Tools tab to fix these issues.
                </Text>
              </VStack>
            </Alert>
          ) : (
            <Alert status="success" size="sm">
              <AlertIcon />
              <Text fontSize="sm">
                ✅ All systems healthy - no issues detected
              </Text>
            </Alert>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default DebugPanel;