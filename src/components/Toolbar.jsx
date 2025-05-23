// src/components/Toolbar.jsx
import { 
  Flex, 
  IconButton, 
  Tooltip, 
  Divider, 
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  HStack,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react';
import { 
  FiFolder, 
  FiFile, 
  FiSave, 
  FiPlay, 
  FiUsers, 
  FiSettings, 
  FiMoon, 
  FiSun, 
  FiDatabase,
  FiZap,
} from 'react-icons/fi';

const Toolbar = ({ activeTab, setActiveTab }) => {
  const { colorMode, toggleColorMode } = useColorMode();
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Flex 
      w="100%" 
      h="48px" 
      bg={bg} 
      borderBottom="1px" 
      borderColor={borderColor} 
      align="center" 
      px={4}
      justify="space-between"
    >
      {/* Left side */}
      <HStack spacing={2}>
        <Tooltip label="Files">
          <IconButton
            aria-label="Files"
            icon={<FiFolder />}
            size="sm"
            variant={activeTab === 0 ? "solid" : "ghost"}
            colorScheme={activeTab === 0 ? "blue" : "gray"}
            onClick={() => setActiveTab(0)}
          />
        </Tooltip>
        
        <Tooltip label="Code Runner">
          <IconButton
            aria-label="Code Runner"
            icon={<FiPlay />}
            size="sm"
            variant={activeTab === 1 ? "solid" : "ghost"}
            colorScheme={activeTab === 1 ? "blue" : "gray"}
            onClick={() => setActiveTab(1)}
          />
        </Tooltip>
        
        <Tooltip label="Clients">
          <IconButton
            aria-label="Clients"
            icon={<FiUsers />}
            size="sm"
            variant={activeTab === 2 ? "solid" : "ghost"}
            colorScheme={activeTab === 2 ? "blue" : "gray"}
            onClick={() => setActiveTab(2)}
          />
        </Tooltip>
        
        <Divider orientation="vertical" h="24px" />
        
        <Tooltip label="Save All">
          <IconButton
            aria-label="Save All"
            icon={<FiSave />}
            size="sm"
            variant="ghost"
          />
        </Tooltip>
        
        <Tooltip label="Run Selected">
          <IconButton
            aria-label="Run Selected"
            icon={<FiZap />}
            size="sm"
            variant="ghost"
            colorScheme="green"
          />
        </Tooltip>
      </HStack>
      
      {/* Right side */}
      <HStack spacing={2}>
        <Tooltip label="Settings">
          <IconButton
            aria-label="Settings"
            icon={<FiSettings />}
            size="sm"
            variant="ghost"
          />
        </Tooltip>
        
        <Tooltip label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}>
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
            size="sm"
            variant="ghost"
            onClick={toggleColorMode}
          />
        </Tooltip>
      </HStack>
    </Flex>
  );
};

export default Toolbar;