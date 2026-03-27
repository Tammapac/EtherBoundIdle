import React, { createContext, useState, useContext, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkSession();

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const userData = mapSupabaseUser(session.user);
          setUser(userData);
          setIsAuthenticated(true);
          localStorage.setItem('eb_local_user', JSON.stringify(userData));
        } else {
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('eb_local_user');
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  function mapSupabaseUser(supaUser) {
    return {
      id: supaUser.id,
      email: supaUser.email || '',
      name: supaUser.user_metadata?.display_name || supaUser.user_metadata?.username || supaUser.email?.split('@')[0] || 'Player',
      role: supaUser.user_metadata?.role || 'player',
      profileImageUrl: supaUser.user_metadata?.avatar_url || null,
    };
  }

  const checkSession = async () => {
    try {
      setIsLoadingAuth(true);

      if (!supabase) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Session check error:', error);
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      if (session?.user) {
        const userData = mapSupabaseUser(session.user);
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('eb_local_user', JSON.stringify(userData));
      } else {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('eb_local_user');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const register = async (email, password, username) => {
    if (!supabase) {
      return { success: false, error: 'Authentication service not available' };
    }

    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: username,
            username: username,
          },
        },
      });

      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }

      if (data.user && !data.session) {
        return { success: true, needsConfirmation: true };
      }

      if (data.session) {
        const userData = mapSupabaseUser(data.user);
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('eb_local_user', JSON.stringify(userData));
      }

      return { success: true };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    }
  };

  const login = async (email, password) => {
    if (!supabase) {
      return { success: false, error: 'Authentication service not available' };
    }

    try {
      setAuthError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setAuthError(error.message);
        return { success: false, error: error.message };
      }

      const userData = mapSupabaseUser(data.user);
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('eb_local_user', JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      setAuthError(err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
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
