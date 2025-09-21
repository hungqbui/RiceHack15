const fetchAllFolders = async () => {
    try {
        // Get the JWT token from localStorage
        const token = localStorage.getItem('token');
        
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:5000/api/folders', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
        
        if (!response.ok) {
            // Handle different error status codes
            if (response.status === 401) {
                // Token is invalid or expired, redirect to login
                localStorage.removeItem('token');
                window.location.href = '/login';
                throw new Error('Authentication failed');
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching folders:', error);
        throw error;
    }
};

export default fetchAllFolders;