import React, { createContext, useState, useContext, useEffect } from 'react';

const API_URL_KEY = 'eb_api_url';
const DEFAULT_API_URL = 'http://46.224.121.242:3000';

function detectApiUrl() {
  const host = window.location.hostname;
  if (host.includes('replit.dev') || host.includes('replit.app') || host === 'localhost' || host === '127.0.0.1') {
    return window.location.origin;
  }
  return DEFAULT_API_URL;
}

function getApiUrl() {
  try {
    const stored = localStorage.getItem(API_URL_KEY);
    if (stored) return stored;
    return detectApiUrl();
  } catch { return DEFAULT_API_URL; }
}

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
      const res = await fetch(`${getApiUrl()}/api/auth/user`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('eb_local_user', JSON.stringify(data.user));
      } else {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('eb_local_user');
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('eb_local_user');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const register = async (email, password, username) => {
    try {
      setAuthError(null);
      const res = await fetch(`${getApiUrl()}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, username }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error);
        return { success: false, error: data.error };
      }

      setUser(data.user);
      setIsAuthenticated(true);
      localStorage.setItem('eb_local_user', JSON.stringify(data.user));
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
      const res = await fetch(`${getApiUrl()}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error);
        return { success: false, error: data.error };
      }

      setUser(data.user);
      setIsAuthenticated(true);
      localStorage.setItem('eb_local_user', JSON.stringify(data.user));
      return { success: true };
    } catch (err) {
      const msg = err.message || 'Login failed';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${getApiUrl()}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {}
    localStorage.removeItem('eb_local_user');
    sessionStorage.removeItem('activeCharacter');
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
