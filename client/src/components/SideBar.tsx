import { useEffect, useState } from "react";
import DocumentItem  from "./DocumentItem.tsx";
import FolderItem from "./FolderItem";
import "./SideBar.css";
import fetchAllDocs from "../utils/fetchAllDocs.ts";
import fetchAllFolders from "../utils/fetchAllFolders.ts";
import createNewFolder from "../utils/createNewFolder.ts";

const SideBar = () => {

    const [chosenFolder, setChosenFolder] = useState('Documents');
    const [documents, setDocuments] = useState<Array<{ documentName: string; docId: string }>>([

    ]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [folderIds, setFolderIds] = useState<string[]>([]);
    const [folders, setFolders] = useState<Array<{ folderName: string; folderId: string }>>([
    ]);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const handleCreateFolder = async () => {
        if (newFolderName.trim()) {
            try {
                // Call the API to create the folder
                const result = await createNewFolder(newFolderName.trim());
                
                // Add the new folder to the local state using API response
                const newFolder = {
                    folderId: result.folder_id,
                    folderName: result.folder_name || newFolderName.trim()
                };
                setFolders([...folders, newFolder]);
                setNewFolderName('');
                setShowCreateFolderModal(false);
            } catch (error) {
                console.error('Failed to create folder:', error);
                // Optionally show an error message to the user
                alert('Failed to create folder. Please try again.');
            }
        }
    };

    const handleModalClose = () => {
        setShowCreateFolderModal(false);
        setNewFolderName('');
    };

    useEffect(() => {
        // Fetch both documents and folders on component mount
        const fetchData = async () => {
            try {
                // Fetch documents
                const docsData = await fetchAllDocs();
                console.log("Fetched documents:", docsData);
                
                // Fetch folders
                const foldersData = await fetchAllFolders();
                console.log("Fetched folders:", foldersData);
                
                // Update folders state
                if (foldersData.status === 'success' && foldersData.folders) {
                    const formattedFolders = foldersData.folders.map((folder: any) => ({
                        folderId: folder.folder_id,
                        folderName: folder.folder_name
                    }));
                    setFolders(formattedFolders);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [])

    return (
        <div className="sidebar-container">
            <button
                className={`sidebar-toggle toggle-left ${sidebarCollapsed ? 'collapsed' : ''}`}
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
                {sidebarCollapsed ? '>' : '<'}
            </button>
            <aside className={`sidebar sidebar-left ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-section">
                    <h2>{chosenFolder}</h2>
                    <ul className="document-list">
                        {documents.map(doc => (
                            <DocumentItem key={doc.docId} documentName={doc.documentName} docId={doc.docId} setFolderIds={setFolderIds} />
                        ))}
                    </ul>
                </div>
                <div className="sidebar-section">
                    <div className="my-folder-btn">
                        <span>My Folders</span>
                        <button 
                            style={{ marginLeft: "auto" }}
                            onClick={() => setShowCreateFolderModal(true)}
                            title="Create new folder"
                        >
                            +
                        </button>
                    </div>
                    <ul className="folder-list">
                       {
                        folders.map(folder => (
                            <FolderItem key={folder.folderId} folderName={folder.folderName} folderId={folder.folderId} selectFolder={setChosenFolder} />
                        ))
                       }
                    </ul>
                </div>
            </aside>

            {/* Create Folder Modal */}
            {showCreateFolderModal && (
                <div className="modal-overlay" onClick={handleModalClose}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create New Folder</h3>
                            <button className="modal-close" onClick={handleModalClose}>×</button>
                        </div>
                        <div className="modal-body">
                            <label htmlFor="folderName">Folder Name:</label>
                            <input
                                id="folderName"
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="Enter folder name"
                                autoFocus
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleCreateFolder();
                                    }
                                }}
                            />
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={handleModalClose}>Cancel</button>
                            <button 
                                className="btn-create" 
                                onClick={handleCreateFolder}
                                disabled={!newFolderName.trim()}
                            >
                                Create Folder
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SideBar;
