import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useOAuth } from '@/hooks/useOAuth';

interface AuthUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  businessName?: string;
  phone?: string;
  role?: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  isRealOAuth: boolean;
  login: (name: string, businessName?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  isLoggedIn: false,
  isLoading: false,
  isRealOAuth: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const oauth = useOAuth();
  const [localUser, setLocalUser] = useState<AuthUser | null>(null);

  // Load local user on mount
  useEffect(() => {
    try {
      const u = localStorage.getItem('qasati_currentUser');
      const uid = localStorage.getItem('qasati_user_id');
      if (u && uid) {
        const parsed = JSON.parse(u);
        setLocalUser({ id: uid, name: parsed.name, businessName: parsed.businessName });
      }
    } catch { /* ignore */ }
  }, []);

  // If real OAuth user is present, clear local user
  useEffect(() => {
    if (oauth.user) {
      setLocalUser(null);
      try {
        localStorage.removeItem('qasati_currentUser');
        localStorage.removeItem('qasati_user_id');
      } catch { /* ignore */ }
    }
  }, [oauth.user]);

  const login = useCallback((name: string, businessName?: string) => {
    const uid = `u_${Date.now()}`;
    try {
      localStorage.setItem('qasati_currentUser', JSON.stringify({ name: name.trim(), businessName: businessName?.trim() }));
      localStorage.setItem('qasati_user_id', uid);
    } catch { /* ignore */ }
    setLocalUser({ id: uid, name: name.trim(), businessName: businessName?.trim() });
  }, []);

  const logout = useCallback(() => {
    if (oauth.isRealOAuth) {
      oauth.logout();
    }
    try {
      localStorage.removeItem('qasati_currentUser');
      localStorage.removeItem('qasati_user_id');
      localStorage.removeItem('qasati_borrowers');
      localStorage.removeItem('qasati_loans');
      localStorage.removeItem('qasati_payments');
      localStorage.removeItem('qasati_notifications');
    } catch { /* ignore */ }
    setLocalUser(null);
    window.location.reload();
  }, [oauth]);

  // Determine effective user
  const effectiveUser = oauth.user
    ? {
        id: String(oauth.user.id || oauth.user.unionId || 'oauth_user'),
        name: oauth.user.name || 'مستخدم',
        email: oauth.user.email || undefined,
        avatar: oauth.user.avatar || undefined,
        role: oauth.user.role || 'user',
      }
    : localUser;

  const value = useMemo(
    () => ({
      user: effectiveUser,
      isLoggedIn: !!effectiveUser,
      isLoading: oauth.isLoading,
      isRealOAuth: oauth.isRealOAuth,
      login,
      logout,
    }),
    [effectiveUser, oauth.isLoading, oauth.isRealOAuth, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
