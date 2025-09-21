// This file is deprecated - useAuth is now provided by AuthContext
// Use import { useAuth } from '../contexts/AuthContext' instead

import { useState, useEffect } from "react";

const useAuthDeprecated = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsAuthenticated(!!token);
    }, []);
    return isAuthenticated;
    
}

export default useAuthDeprecated;