interface ChatResponse {
  status: string;
  answer: string;
  sources?: any[];
  message?: string;
  file_ids?: string[];
  found_files?: string[];
  total_chunks?: number;
  context_summary?: {
    files_used: number;
    total_files_requested: number;
    chunks_per_file: number;
  };
}

const ragChat = async (question: string, fileIds?: string[]): Promise<ChatResponse> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Use different endpoints based on whether fileIds are provided
    let endpoint = 'http://localhost:5000/api/chat';
    let requestBody: any = {
      message: question
    };

    // If file IDs are provided, use the /api/chat/files endpoint
    if (fileIds && fileIds.length > 0) {
      endpoint = 'http://localhost:5000/api/chat/files';
      requestBody = {
        message: question,
        file_ids: fileIds,
        max_chunks_per_file: 3  // You can adjust this as needed
      };
    }

    console.log(requestBody)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
      throw new Error(`Chat request failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('Error in RAG chat:', error);
    throw error;
  }
};

export default ragChat;