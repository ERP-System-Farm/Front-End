import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getMe } from '../features/auth/services';
import { cacheGet, cacheSet, cacheClear } from '../utils/cache';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());
  const refreshingRef = useRef(false);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    cacheClear();
    setUser(null);
  };

  const refreshUser = async (force = false) => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    // Throttle background refreshes to once every 10 seconds unless forced
    if (!force && Date.now() - lastRefreshed < 10000) {
      return user;
    }

    // Prevent concurrent duplicate refreshes
    if (refreshingRef.current) {
      return user;
    }

    refreshingRef.current = true;
    try {
      const userData = await getMe();
      setUser(userData);
      cacheSet('atlas_user_profile', userData, 30 * 60 * 1000); // 30 minutes TTL
      setLastRefreshed(Date.now());
      return userData;
    } catch (error) {
      console.error('Failed to background-refresh user auth state:', error);
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        logout();
      }
    } finally {
      refreshingRef.current = false;
    }
    return null;
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        const cachedUser = cacheGet('atlas_user_profile');
        if (cachedUser) {
          setUser(cachedUser);
          setLoading(false);
          // background refresh
          try {
            const userData = await getMe();
            setUser(userData);
            cacheSet('atlas_user_profile', userData, 30 * 60 * 1000); // 30 minutes TTL
            setLastRefreshed(Date.now());
          } catch (error) {
            console.error('Failed to background initAuth:', error);
          }
        } else {
          try {
            const userData = await getMe();
            setUser(userData);
            cacheSet('atlas_user_profile', userData, 30 * 60 * 1000); // 30 minutes TTL
            setLastRefreshed(Date.now());
          } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
          } finally {
            setLoading(false);
          }
        }
      } else {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      refreshUser();
    }, 30000); // 30 seconds background polling
    return () => clearInterval(interval);
  }, [user, lastRefreshed]);

  useEffect(() => {
    const handlePermissionsChanged = () => {
      console.log('[AuthContext] Permissions hash shift detected. Forcing user refresh...');
      refreshUser(true);
    };
    window.addEventListener('auth-permissions-changed', handlePermissionsChanged);
    return () => window.removeEventListener('auth-permissions-changed', handlePermissionsChanged);
  }, [user, lastRefreshed]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__debugPermissions = () => {
        console.log('--- ATLS Enterprise Authorization Diagnostics ---');
        console.log('User Account:', user?.email);
        console.log('Assigned Role:', user?.role);
        console.log('Dynamic Override Permissions:', user?.permissions);
        console.log('Permissions State SHA256 Hash:', user?.permissions_hash);
      };
    }
  }, [user]);

  const login = (accessToken, refreshToken, userData) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    setUser(userData);
    cacheSet('atlas_user_profile', userData, 30 * 60 * 1000); // 30 minutes TTL
    setLastRefreshed(Date.now());
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );

};

export const useAuth = () => useContext(AuthContext);
