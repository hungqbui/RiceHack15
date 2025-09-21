interface Document {
  file_id: string;
  filename: string;
  upload_timestamp: string;
  file_type: string;
  document_count: number;
  total_text_length: number;
  folder_id: string;
}

interface FolderDocumentsResponse {
  status: string;
  documents: Document[];
  count: number;
  folder_id: string;
  folder_name: string;
  message?: string;
}

const fetchAllDocsFromMultipleFolders = async (folderIds: string[]): Promise<string[]> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const allFileIds: string[] = [];

    // Fetch documents from each folder
    for (const folderId of folderIds) {
      try {
        const response = await fetch(`http://localhost:5000/api/list_docs_from_folder?folder_id=${folderId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
            throw new Error('Authentication failed');
          }
          console.warn(`Failed to fetch documents from folder ${folderId}: ${response.status}`);
          continue; // Skip this folder and continue with others
        }

        const data: FolderDocumentsResponse = await response.json();
        
        if (data.status === 'success' && data.documents) {
          // Extract file_ids from documents
          const fileIds = data.documents.map(doc => doc.file_id);
          allFileIds.push(...fileIds);
        }
      } catch (error) {
        console.error(`Error fetching documents from folder ${folderId}:`, error);
        // Continue with other folders even if one fails
      }
    }

    return allFileIds;
    
  } catch (error) {
    console.error('Error fetching documents from multiple folders:', error);
    throw error;
  }
};

export default fetchAllDocsFromMultipleFolders;