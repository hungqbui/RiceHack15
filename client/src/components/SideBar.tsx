import { useEffect, useState } from "react";
import DocumentItem  from "./DocumentItem.tsx";
import FolderItem from "./FolderItem";
import "./SideBar.css";
import fetchAllDocs from "../utils/fetchAllDocs.ts";
import fetchAllFolders from "../utils/fetchAllFolders.ts";
import createNewFolder from "../utils/createNewFolder.ts";
import fetchAllDocsFromFolder from "../utils/fetchAllDocsFromFolder.ts";

const SideBar = () => {

    const [chosenFolder, setChosenFolder] = useState('Documents');
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null); // Track currently selected folder
    const [foldersLoading, setFoldersLoading] = useState(true);
    const [documentsLoading, setDocumentsLoading] = useState(true);
    const [documents, setDocuments] = useState<Array<{ documentName: string; docId: string }>>([

    ]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [folders, setFolders] = useState<Array<{ folderName: string; folderId: string }>>([
    ]);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleDocumentsSelect = async () => {
        setChosenFolder('Documents');
        setSelectedFolderId(null);
        setDocumentsLoading(true);
        
        try {
            // Fetch all documents (not folder-specific)
            const docsData = await fetchAllDocs();
            console.log("Fetched all documents:", docsData);
            
            if (docsData.files && Array.isArray(docsData.files)) {
                const formattedDocs = docsData.files.map((file: any) => ({
                    docId: file.file_id,
                    documentName: file.filename
                }));
                setDocuments(formattedDocs);
            } else {
                setDocuments([]);
            }
        } catch (error) {
            console.error('Error fetching all documents:', error);
            setDocuments([]);
        } finally {
            setDocumentsLoading(false);
        }
    };

    const handleFolderSelect = async (folderName: string, folderId: string) => {
        setChosenFolder(folderName);
        setSelectedFolderId(folderId);
        setDocumentsLoading(true);
        
        try {
            // Fetch documents from the selected folder
            const folderDocsData = await fetchAllDocsFromFolder(folderId);
            console.log("Fetched documents from folder:", folderDocsData);
            
            if (folderDocsData.status === 'success' && folderDocsData.documents) {
                const formattedDocs = folderDocsData.documents.map((doc: any) => ({
                    docId: doc.file_id,
                    documentName: doc.filename
                }));
                setDocuments(formattedDocs);
            } else {
                // If no documents in folder, set empty array
                setDocuments([]);
            }
        } catch (error) {
            console.error('Error fetching documents from folder:', error);
            // On error, set empty documents array
            setDocuments([]);
        } finally {
            setDocumentsLoading(false);
        }
    };

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

    const handleUploadModalClose = () => {
        setShowUploadModal(false);
        setSelectedFile(null);
        setUploading(false);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Check if file is PDF
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                setSelectedFile(file);
            } else {
                alert('Please select a PDF file.');
                event.target.value = ''; // Reset input
            }
        }
    };

    const handleFileUpload = async () => {
        if (!selectedFile || !selectedFolderId) {
            alert('Please select a file and ensure a folder is selected.');
            return;
        }

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('folder_id', selectedFolderId);

            const response = await fetch('http://localhost:5000/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    throw new Error('Authentication failed');
                }
                throw new Error(`Upload failed: ${response.status}`);
            }

            const result = await response.json();
            console.log('Upload successful:', result);

            // Immediately add the new document to the UI for instant feedback
            if (result.status === 'success' && result.file_id) {
                const newDoc = {
                    docId: result.file_id,
                    documentName: result.filename || selectedFile.name
                };
                setDocuments(prevDocs => [...prevDocs, newDoc]);
            }

            // Close modal and reset state immediately
            handleUploadModalClose();

            // Optional: Refresh the folder in the background to ensure consistency
            if (selectedFolderId) {
                // Use setTimeout to avoid blocking the UI update
                setTimeout(async () => {
                    try {
                        await handleFolderSelect(chosenFolder, selectedFolderId);
                    } catch (error) {
                        console.error('Background refresh error:', error);
                    }
                }, 100);
            }

        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        // Fetch both documents and folders on component mount
        const fetchData = async () => {
            setFoldersLoading(true);
            setDocumentsLoading(true);
            try {
                // Fetch all documents initially
                const docsData = await fetchAllDocs();
                console.log("Fetched documents:", docsData);
                
                // Format and set documents
                if (docsData.files && Array.isArray(docsData.files)) {
                    const formattedDocs = docsData.files.map((file: any) => ({
                        docId: file.file_id,
                        documentName: file.filename
                    }));
                    setDocuments(formattedDocs);
                }
                
                // Fetch folders
                const foldersData = await fetchAllFolders();
                console.log("Fetched folders:", foldersData);
                
                // Update folders state
                if (foldersData.status === 'success' && foldersData.folders) {
                    const formattedFolders = foldersData.folders.map((folder: any) => ({
                        folderId: folder.folder_id,
                        folderName: folder.folder_name
                    }));
                    console.log("Formatted folders:", formattedFolders);
                    setFolders(formattedFolders);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setFoldersLoading(false);
                setDocumentsLoading(false);
            }
        };

        fetchData();
    }, [])

    return (
        <div className="sidebar-container">
            <button
  className={`sidebar-toggle toggle-left ${!sidebarCollapsed ? 'collapsed active' : ''}`}
  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
  aria-label={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}
>
  <span
    className={`block w-6 h-0.5 mb-1 rounded transition-all duration-300
    ${sidebarCollapsed ? "rotate-45 translate-y-2 bg-gray-600 dark:bg-gray-100" : "bg-black dark:bg-white"}`}
  ></span>
  <span
    className={`block w-6 h-0.5 mb-1 rounded transition-all duration-300
    ${sidebarCollapsed ? "opacity-0" : "bg-black dark:bg-white"}`}
  ></span>
  <span
    className={`block w-6 h-0.5 rounded transition-all duration-300
    ${sidebarCollapsed ? "-rotate-45 -translate-y-2 bg-gray-600 dark:bg-gray-100" : "bg-black dark:bg-white"}`}
  ></span>
</button>
            <aside className={`sidebar sidebar-left ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-section">
                    <div className="folder-bar" style={{ display: 'flex', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, padding: 0 }}>
                            {chosenFolder}
                        </h2>
                        {chosenFolder !== 'Documents' && (
                            <button 
                                style={{ marginLeft: "auto" }}
                                onClick={() => setShowUploadModal(true)}
                                title="Upload PDF to this folder"
                            >
                                +
                            </button>
                        )}
                    </div>
                    <div className="documents-nav" style={{ marginBottom: '10px' }}>
                        
                    </div>
                    <ul className="document-list">
                        {documentsLoading ? (
                            <div className="fancy-loader-container">
                                <div className="fancy-loader">
                                    <div className="loader-dot"></div>
                                    <div className="loader-dot"></div>
                                    <div className="loader-dot"></div>
                                </div>
                                <div className="loader-text">Loading documents...</div>
                            </div>
                        ) : (
                            documents.map(doc => (
                                <DocumentItem key={doc.docId} documentName={doc.documentName} docId={doc.docId} />
                            ))
                        )}
                    </ul>
                </div>
                <div className="sidebar-section">
                    <div className="my-folder-btn">
                        <h2 style={{ margin: 0, padding: 0, display: "inline-block" }}>My Folders</h2>
                        <button 
                            style={{ marginLeft: "auto" }}
                            onClick={() => setShowCreateFolderModal(true)}
                        >
                            +
                        </button>
                    </div>
                    <ul className="folder-list">
                        {foldersLoading ? (
                            <div className="fancy-loader-container">
                                <div className="fancy-loader">
                                    <div className="loader-dot"></div>
                                    <div className="loader-dot"></div>
                                    <div className="loader-dot"></div>
                                </div>
                                <div className="loader-text">Loading folders...</div>
                            </div>
                        ) : (
                            folders.map(folder => (
                                <FolderItem 
                                    key={folder.folderId} 
                                    folderName={folder.folderName} 
                                    folderId={folder.folderId} 
                                    selectFolder={handleFolderSelect} 
                                />
                            ))
                        )}
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

            {/* Upload File Modal */}
            {showUploadModal && (
                <div className="modal-overlay" onClick={!uploading ? handleUploadModalClose : undefined}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Upload PDF to {chosenFolder}</h3>
                            {!uploading && (
                                <button className="modal-close" onClick={handleUploadModalClose}>×</button>
                            )}
                        </div>
                        <div className="modal-body">
                            {!uploading ? (
                                <>
                                    <label htmlFor="fileInput">Select PDF File:</label>
                                    <input
                                        id="fileInput"
                                        type="file"
                                        accept=".pdf,application/pdf"
                                        onChange={handleFileSelect}
                                        style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                                    />
                                    {selectedFile && (
                                        <div style={{ marginTop: '10px', color: '#666' }}>
                                            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <div style={{ marginBottom: '10px' }}>Uploading {selectedFile?.name}...</div>
                                    <div style={{ 
                                        width: '100%', 
                                        height: '4px', 
                                        backgroundColor: '#f0f0f0', 
                                        borderRadius: '2px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            backgroundColor: '#007bff',
                                            animation: 'progress 2s infinite linear',
                                            transformOrigin: 'left'
                                        }}></div>
                                    </div>
                                    <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                                        Please wait...
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button 
                                className="btn-cancel" 
                                onClick={handleUploadModalClose}
                                disabled={uploading}
                            >
                                Cancel
                            </button>
                            <button 
                                className="btn-create" 
                                onClick={handleFileUpload}
                                disabled={!selectedFile || uploading}
                            >
                                {uploading ? 'Uploading...' : 'Upload PDF'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SideBar;
