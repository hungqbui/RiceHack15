import React from "react";
import { useChosenDocuments } from "../contexts/ChosenDocumentsContext";

interface DocumentItemProps {
  documentName: string;
  docId: string;
}

const DocumentItem: React.FC<DocumentItemProps> = ({ documentName, docId }) => {
    const { chosenDocuments, toggleDocument } = useChosenDocuments();

    const handleCheckboxChange = () => {
        console.log("Checkbox changed for document:", documentName, "Doc ID:", docId);
        toggleDocument(docId);
    };

    return (
        <li className="document-item">
            <span>{documentName}</span>
            <input 
                type="checkbox" 
                checked={chosenDocuments.has(docId)} 
                onChange={handleCheckboxChange}
                title={`Select ${documentName} for search context`}
            />
        </li>
    );
}

export default DocumentItem;