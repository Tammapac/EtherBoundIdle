import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '../api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      setIsLoadingAuth(true);
      const me = await base44.auth.me();
      if (me) {
        // Fetch role from user_roles table
        try {
          const roleData = await base44.functions.invoke("getCurrentUser", {});
          if (roleData?.role) {
            me.role = roleData.role;
          }
        } catch {}
        setUser(me);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const register = async (email, password, username) => {
    try {
      setAuthError(null);
      const apiUrl = base44.getApiUrl();
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, username }),
      });
      const json = await res.json();

      if (!res.ok || json.success === false) {
        const msg = json.error || 'Registration failed';
        setAuthError(msg);
        return { success: false, error: msg };
      }

      const data = json.data || {};
      if (data.sessionId) {
        localStorage.setItem('eb_session_id', data.sessionId);
      }
      const u = data.user;
      setUser(u);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Registration failed';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const login = async (email, password) => {
    try {
      setAuthError(null);
      const apiUrl = base44.getApiUrl();
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (!res.ok || json.success === false) {
        const msg = json.error || 'Login failed';
        setAuthError(msg);
        return { success: false, error: msg };
      }

      const data = json.data || {};
      if (data.sessionId) {
        localStorage.setItem('eb_session_id', data.sessionId);
      }
      const u = data.user;
      setUser(u);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Login failed';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    await base44.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError,
      appPublicSettings: null,
      register,
      login,
      logout,
      navigateToLogin: () => {},
      checkAppState: checkSession,
    }}>
      {children}
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
