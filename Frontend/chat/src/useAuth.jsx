import { useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthProvider.jsx';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthLogic = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);


  useEffect(() => {
    const checkAuth = async () => {
      const token = sessionStorage.getItem('token');

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Add timeout to prevent long waits
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch('https://brochat2.onrender.com/validate-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const data = await response.json();

        if (data.valid) {
          setIsAuthenticated(true);
          setUser(data.user);
          sessionStorage.setItem('user', JSON.stringify(data.user));
        } else {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('Auth check timeout - treating as invalid');
        } else {
          console.error('Auth check failed:', error);
        }
        // Clear invalid data
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (token, userData) => {
    // Set state first for immediate UI update
    setIsAuthenticated(true);
    setUser(userData);

    // Store in sessionStorage (non-blocking)
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = (navigate) => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('chatUser');
    setIsAuthenticated(false);
    setUser(null);


    if (navigate) {
      navigate('/', { replace: true });
    }
  }; return {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout
  };
};