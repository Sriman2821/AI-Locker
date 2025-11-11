import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44, APIError } from '../api/productionClient.js';
 
const AuthContext = createContext(null);
 
export const AuthProvider = ({ children }) => {
   const [user, setUser] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
 
   useEffect(() => {
    let mounted = true;
    const initAuth = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Auth: Initializing...');
 
        const token = localStorage.getItem('token');
        console.log('Auth: Token status:', !!token);
 
        if (!token) {
          console.log('Auth: No token found');
          setUser(null);
          return;
        }
 
        console.log('Auth: Validating token...');
        try {
          const userData = await base44.auth.me();
          if (!mounted) return;
          console.log('Auth: User data received:', userData);
          setUser(userData);
        } catch (meErr) {
          // Only clear token on authentication errors (401). Keep token on transient/network/server errors.
          if (meErr instanceof APIError && meErr.status === 401) {
            console.warn('Auth: Token invalid or expired - removing token', meErr);
            localStorage.removeItem('token');
            setUser(null);
            setError('Authentication required');
          } else {
            // Transient or server error: keep token and don't force logout.
            console.warn('Auth: Non-auth error during token validation - keeping token (will retry later):', meErr);
            // Do not setUser(null) or remove token here to prevent unexpected logout on refresh spikes.
          }
        }
      } catch (err) {
        console.error('Auth: Unexpected error during initialization:', err);
        setError(err.message || 'Initialization error');
      } finally {
        console.log('Auth: Initialization complete');
        if (mounted) setLoading(false);
      }
    };
 
    initAuth();
    return () => { mounted = false; };
  }, []);
 
   const login = async (email, password) => {
     const response = await base44.auth.login(email, password);
     localStorage.setItem('token', response.token);
     setUser(response.user);
     return response.user;
   };
 
   const signup = async (userData) => {
     const response = await base44.auth.signup(userData);
     localStorage.setItem('token', response.token);
     setUser(response.user);
     return response.user;
   };
 
   const logout = () => {
     localStorage.removeItem('token');
     setUser(null);
   };
 
   const value = {
     user,
     loading,
     login,
     signup,
     logout,
     isAdmin: user?.role === 'admin',
   };
 
   return (
     <AuthContext.Provider value={value}>
       {!loading && children}
     </AuthContext.Provider>
   );
 };
 
 export const useAuth = () => {
   const context = useContext(AuthContext);
   if (!context) {
     throw new Error('useAuth must be used within an AuthProvider');
   }
   return context;
 };