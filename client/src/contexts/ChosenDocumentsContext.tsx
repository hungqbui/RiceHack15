import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface ChosenDocumentsContextType {
  chosenDocuments: Set<string>;
  setChosenDocuments: React.Dispatch<React.SetStateAction<Set<string>>>;
  toggleDocument: (docId: string) => void;
  clearChosenDocuments: () => void;
  getChosenDocumentsArray: () => string[];
}

const ChosenDocumentsContext = createContext<ChosenDocumentsContextType | undefined>(undefined);

export const useChosenDocuments = () => {
  const context = useContext(ChosenDocumentsContext);
  if (context === undefined) {
    throw new Error('useChosenDocuments must be used within a ChosenDocumentsProvider');
  }
  return context;
};

interface ChosenDocumentsProviderProps {
  children: ReactNode;
}

export const ChosenDocumentsProvider: React.FC<ChosenDocumentsProviderProps> = ({ children }) => {
  const [chosenDocuments, setChosenDocuments] = useState<Set<string>>(new Set());

  const toggleDocument = (docId: string) => {
    setChosenDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      console.log('Chosen documents:', newSet);
      return newSet;
    });
  };

  const clearChosenDocuments = () => {
    setChosenDocuments(new Set());
  };

  const getChosenDocumentsArray = () => {
    return Array.from(chosenDocuments);
  };

  const value = {
    chosenDocuments,
    setChosenDocuments,
    toggleDocument,
    clearChosenDocuments,
    getChosenDocumentsArray,
  };

  return (
    <ChosenDocumentsContext.Provider value={value}>
      {children}
    </ChosenDocumentsContext.Provider>
  );
};