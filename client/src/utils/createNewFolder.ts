const createNewFolder = async (folderName: string) => {
    try {
        // Get the JWT token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
            throw new Error('No authentication token found');
        }

        // Logic to create a new folder
        const response = await fetch('http://localhost:5000/api/createFolder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ "folder_name": folderName }),
        });

        if (!response.ok) {
            // Handle different error status codes
            if (response.status === 401) {
                // Token is invalid or expired, redirect to login
                localStorage.removeItem('token');
                window.location.href = '/login';
                throw new Error('Authentication failed');
            }
            throw new Error(`Failed to create folder: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating folder:', error);
        throw error;
    }
}

export default createNewFolder;
