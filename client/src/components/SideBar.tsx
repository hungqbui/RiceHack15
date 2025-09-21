import { useEffect, useState } from "react";
import DocumentItem  from "./DocumentItem.tsx";
import FolderItem from "./FolderItem";
import "./SideBar.css";

const SideBar = ({  } : any) => {

    const [chosenFolder, setChosenFolder] = useState('Documents');
    const [documents, setDocuments] = useState<Array<{ documentName: string; docId: string }>>([
        { documentName: "Algebra Notes", docId: "1" },
        { documentName: "Biology Notes", docId: "2" },
        { documentName: "Chemistry Notes", docId: "3" }
    ]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const [folders, setFolders] = useState<Array<{ folderName: string; folderId: string }>>([
        
    ]);

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
                            <DocumentItem key={doc.docId} documentName={doc.documentName} docId={doc.docId}  />
                        ))}
                    </ul>
                </div>
                <div className="sidebar-section">
                    <button className="my-folder-btn">My Folder</button>
                    <ul className="folder-list">
                       {
                        folders.map(folder => (
                            <FolderItem key={folder.folderId} folderName={folder.folderName} folderId={folder.folderId} selectFolder={setChosenFolder} />
                        ))
                       }
                    </ul>
                </div>
            </aside>
        </div>
    );
}

export default SideBar;
