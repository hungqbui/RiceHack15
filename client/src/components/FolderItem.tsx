
import React from 'react';
import { useChosenFolders } from '../contexts/ChosenFoldersContext';

interface FolderItemProps {
  folderName: string;
  folderId: string;
  selectFolder: (folderName: string, folderId: string) => void;
}

const FolderItem: React.FC<FolderItemProps> = ({ folderName, folderId, selectFolder }) => {
 
    const handleFolderClick = () => {
        selectFolder(folderName, folderId);
    };

    return (
        <li className="folder-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                
                <details onClick={handleFolderClick} style={{ cursor: 'pointer', flex: 1 }}>
                    <summary>{folderName}</summary>
                </details>
            </div>
        </li>
    );
};

export default FolderItem;
