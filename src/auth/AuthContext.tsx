import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { env, isBackendConfigured } from '../config/env';
import type { Permission } from './permissions';

export interface CurrentUser {
  id: string;
  displayName: string;
  rank: string;
  callsign?: string;
  avatarUrl?: string;
  discordLinked: boolean;
  permissions: Permission[];
}

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'unconfigured' | 'unauthorised';

interface AuthContextValue {
  status: AuthStatus;
  user: CurrentUser | null;
  error: string | null;
  loginUrl: string;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const setupUser: CurrentUser = {
  id: 'setup-admin',
  displayName: 'Setup Mode',
  rank: 'Administrator',
  callsign: 'Setup',
  discordLinked: false,
  permissions: [
    'dashboard.read',
    'roster.read',
    'roster.manage',
    'discord_ids.manage',
    'cadets.read',
    'training.read',
    'training.manage',
    'probationer_tests.read',
    'probationer_tests.manage',
    'documents.read',
    'documents.manage',
    'forms.read',
    'forms.manage',
    'admin.read',
    'admin.manage',
    'audit_logs.read',
  ],
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(response.status === 401 ? 'Not signed in' : `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(isBackendConfigured ? 'loading' : 'unconfigured');
  const [user, setUser] = useState<CurrentUser | null>(isBackendConfigured ? null : setupUser);
  const [error, setError] = useState<string | null>(null);

  const loginUrl = useMemo(() => {
    if (!isBackendConfigured) return '';
    const returnTo = `${window.location.origin}${window.location.pathname}${window.location.hash || '#/'}`;
    const params = new URLSearchParams({ returnTo });
    return `${env.apiBaseUrl}/auth/discord/start?${params.toString()}`;
  }, []);

  const refreshSession = useCallback(async () => {
    if (!isBackendConfigured) {
      setStatus('unconfigured');
      setUser(setupUser);
      return;
    }

    try {
      setError(null);
      const session = await fetchJson<{ user: CurrentUser | null; unauthorised?: boolean }>('/auth/session');
      if (session.unauthorised) {
        setStatus('unauthorised');
        setUser(null);
        return;
      }
      setUser(session.user);
      setStatus(session.user ? 'authenticated' : 'unauthenticated');
    } catch (sessionError) {
      setUser(null);
      setStatus('unauthenticated');
      setError(sessionError instanceof Error ? sessionError.message : 'Unable to load session');
    }
  }, []);

  const logout = useCallback(async () => {
    if (!isBackendConfigured) return;
    await fetchJson('/auth/logout', { method: 'POST' }).catch(() => undefined);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const value = useMemo(
    () => ({ status, user, error, loginUrl, refreshSession, logout }),
    [status, user, error, loginUrl, refreshSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
