import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api, type AppUser, type UserRole } from '@/lib/api';

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AppUser>;
  logout: () => void;
  setSessionUser: (user: AppUser, token?: string) => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = 'chaincert_token';
const USER_KEY = 'chaincert_user';

const RATE_LIMIT_KEY = 'chaincert_auth_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30 * 1000; // 30 seconds

function checkRateLimit(): void {
  try {
    const record = sessionStorage.getItem(RATE_LIMIT_KEY);
    if (!record) return;
    const { count, lockedUntil } = JSON.parse(record);
    const now = Date.now();
    if (lockedUntil && now < lockedUntil) {
      const waitSec = Math.ceil((lockedUntil - now) / 1000);
      throw new Error(`Too many authentication attempts. Please wait ${waitSec} second${waitSec === 1 ? '' : 's'} before trying again.`);
    }
  } catch (err: any) {
    if (err.message?.includes('Too many authentication attempts')) throw err;
  }
}

function recordFailedAttempt(): void {
  try {
    const record = sessionStorage.getItem(RATE_LIMIT_KEY);
    const now = Date.now();
    let count = 1;
    if (record) {
      const data = JSON.parse(record);
      count = (data.count || 0) + 1;
    }
    const lockedUntil = count >= MAX_ATTEMPTS ? now + LOCKOUT_MS : undefined;
    sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ count, lockedUntil, lastAttempt: now }));
  } catch {}
}

function resetRateLimit(): void {
  try {
    sessionStorage.removeItem(RATE_LIMIT_KEY);
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<AppUser> => {
    checkRateLimit();
    try {
      const res = await api.login(email, password);
      resetRateLimit();
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      setUser(res.user);
      return res.user;
    } catch (err) {
      recordFailedAttempt();
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const setSessionUser = (newUser: AppUser, token: string = 'demo-session-token') => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setSessionUser, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
