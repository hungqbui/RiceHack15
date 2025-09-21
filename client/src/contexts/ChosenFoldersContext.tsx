import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface ChosenFoldersContextType {
  chosenFolders: Set<string>;
  setChosenFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
  toggleFolder: (folderId: string) => void;
  clearChosenFolders: () => void;
  getChosenFoldersArray: () => string[];
}

const ChosenFoldersContext = createContext<ChosenFoldersContextType | undefined>(undefined);

export const useChosenFolders = () => {
  const context = useContext(ChosenFoldersContext);
  if (context === undefined) {
    throw new Error('useChosenFolders must be used within a ChosenFoldersProvider');
  }
  return context;
};

interface ChosenFoldersProviderProps {
  children: ReactNode;
}

export const ChosenFoldersProvider: React.FC<ChosenFoldersProviderProps> = ({ children }) => {
  const [chosenFolders, setChosenFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    setChosenFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      console.log(newSet)
      return newSet;
    });
  };

  const clearChosenFolders = () => {
    setChosenFolders(new Set());
  };

  const getChosenFoldersArray = () => {
    return Array.from(chosenFolders);
  };

  const value = {
    chosenFolders,
    setChosenFolders,
    toggleFolder,
    clearChosenFolders,
    getChosenFoldersArray,
  };

  return (
    <ChosenFoldersContext.Provider value={value}>
      {children}
    </ChosenFoldersContext.Provider>
  );
};