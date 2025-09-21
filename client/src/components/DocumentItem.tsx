import React, { useState } from "react";

const DocumentItem = ({ documentName, docId, setFolderIds } : any) => {
    const [isChecked, setIsChecked] = useState(false);

    const handleCheckboxChange = () => {
        console.log("Checkbox changed for document:", documentName, "Checked:", !isChecked);
        if (!isChecked) {
            setFolderIds((prev : any) => [...prev, docId]);
        }
        else {
            setFolderIds((prev: string[]) => {
                return prev.filter(id => id !== docId);
            });
        }
        setIsChecked(!isChecked);
    };

    return (
        <li className="document-item">
            <span>{documentName}</span>
            <input type="checkbox" checked={isChecked} onChange={handleCheckboxChange} />
        </li>
    );
}

export default DocumentItem;