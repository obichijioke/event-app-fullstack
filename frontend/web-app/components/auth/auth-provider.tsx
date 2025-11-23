'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  authService,
  type LoginRequest,
  type LoginResponse,
  type RegisterRequest,
  type User,
} from '@/services/auth.service';
import { setAccessToken as setTokenStoreToken } from '@/lib/auth/token-store';
import { useOrganizerStore } from '@/lib/stores/organizer-store';

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  initialized: boolean;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  registerAndLogin: (data: RegisterRequest) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const clearOrganizerState = useOrganizerStore((state) => state.clearState);
  const prevUserIdRef = useRef<string | null>(null);

  // Sync accessToken state with token-store whenever it changes
  useEffect(() => {
    setTokenStoreToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const session = authService.getStoredSession();
      if (session?.user && active) {
        setUser(session.user);
      }

      try {
        const token = await authService.refreshAccessToken();
        if (!active) return;

        setAccessToken(token);
        const profile = await authService.getProfile(token);
        if (!active) return;

        setUser(profile);
        authService.setStoredUser(profile);
      } catch {
        if (active) {
          authService.clearSession();
          setUser(null);
          setAccessToken(null);
          clearOrganizerState();
        }
      } finally {
        if (active) {
          setInitialized(true);
        }
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    const response = await authService.login(credentials);
    clearOrganizerState();
    setUser(response.user);
    setAccessToken(response.accessToken);
    return response;
  }, [clearOrganizerState]);

  const registerAndLogin = useCallback(async (data: RegisterRequest) => {
    await authService.register(data);
    return login({ email: data.email, password: data.password });
  }, [login]);

  const logout = useCallback(async () => {
    await authService.logout(accessToken ?? undefined);
    setUser(null);
    setAccessToken(null);
    clearOrganizerState();
  }, [accessToken, clearOrganizerState]);

  const refreshProfile = useCallback(async () => {
    let token = accessToken;

    if (!token) {
      try {
        token = await authService.refreshAccessToken();
        setAccessToken(token);
      } catch {
        authService.clearSession();
        setUser(null);
        clearOrganizerState();
        return null;
      }
    }

    const profile = await authService.getProfile(token);
    setUser(profile);
    authService.setStoredUser(profile);
    return profile;
  }, [accessToken]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      initialized,
      login,
      registerAndLogin,
      logout,
      refreshProfile,
    }),
    [accessToken, initialized, login, logout, registerAndLogin, refreshProfile, user],
  );

  useEffect(() => {
    const current = user?.id ?? null;
    const previous = prevUserIdRef.current;
    if (previous && current && previous !== current) {
      clearOrganizerState();
    }
    prevUserIdRef.current = current;
  }, [clearOrganizerState, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
