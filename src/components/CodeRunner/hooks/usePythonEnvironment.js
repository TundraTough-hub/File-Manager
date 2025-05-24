// src/components/CodeRunner/hooks/usePythonEnvironment.js - Python detection hook
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export const usePythonEnvironment = () => {
  const [pythonInstalled, setPythonInstalled] = useState(null);
  const [availablePythonCommands, setAvailablePythonCommands] = useState([]);
  const [checking, setChecking] = useState(false);

  // Check Python installation on hook initialization
  useEffect(() => {
    checkPythonInstallation();
  }, []);

  const checkPythonInstallation = async () => {
    if (checking) return; // Prevent multiple simultaneous checks
    
    try {
      setChecking(true);
      console.log('🐍 Checking Python installation...');
      
      const pythonCommands = await invoke('check_python_installation');
      setAvailablePythonCommands(pythonCommands);
      setPythonInstalled(pythonCommands.length > 0);
      
      if (pythonCommands.length > 0) {
        console.log('✅ Python commands available:', pythonCommands);
      } else {
        console.log('❌ No Python installation found');
      }
    } catch (error) {
      console.error('❌ Failed to check Python installation:', error);
      setPythonInstalled(false);
      setAvailablePythonCommands([]);
    } finally {
      setChecking(false);
    }
  };

  const installPackage = async (packageName, pythonCmd = null) => {
    try {
      console.log('📦 Installing Python package:', packageName);
      
      const result = await invoke('install_python_package', {
        packageName,
        pythonCmd,
      });
      
      console.log('✅ Package installation result:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to install package:', error);
      throw error;
    }
  };

  const getPythonStatus = () => {
    if (checking) return 'checking';
    if (pythonInstalled === null) return 'unknown';
    if (pythonInstalled === true) return 'available';
    return 'unavailable';
  };

  const getPrimaryPythonCommand = () => {
    if (availablePythonCommands.length === 0) return null;
    
    // Prefer python3 over python if both are available
    if (availablePythonCommands.includes('python3')) {
      return 'python3';
    }
    
    return availablePythonCommands[0];
  };

  return {
    // State
    pythonInstalled,
    availablePythonCommands,
    checking,
    
    // Computed values
    pythonStatus: getPythonStatus(),
    primaryPythonCommand: getPrimaryPythonCommand(),
    
    // Actions
    checkPythonInstallation,
    installPackage,
  };
};