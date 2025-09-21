

const FolderItem = ({ folderName, selectFolder } : any) => {
    return (
        <li className="folder-item" onClick={() => selectFolder(folderName)}>
            <details>
                <summary>{folderName}</summary>
            </details>
        </li>
    );
};

export default FolderItem;
