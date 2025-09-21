import React, { useState } from "react";

const DocumentItem = ({ documentName, docId } : { documentName: string, docId: string }) => {
    const [isChecked, setIsChecked] = useState(false);

    const handleCheckboxChange = () => {
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