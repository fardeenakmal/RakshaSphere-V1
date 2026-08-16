import { create } from 'zustand';
import { type User, type UserRole } from '@/types';
import { apiService } from '@/services/api';

interface AuthState {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  initializeAuth: () => Promise<boolean>;
  loginAsync: (username: string, password: string, mfaCode?: string, rememberMe?: boolean) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  canPerformAction: (action: 'REMEDIATE' | 'DEPLOY_HONEYPOT' | 'MANAGE_USERS' | 'MANAGE_SETTINGS' | 'VIEW_AUDIT') => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  token: null,
  isAuthenticated: false,
  isInitializing: true,

  initializeAuth: async () => {
    if (typeof window === 'undefined') {
      set({ isInitializing: false });
      return false;
    }

    const storedToken = localStorage.getItem('rakshasphere_token') || sessionStorage.getItem('rakshasphere_token');

    if (!storedToken) {
      set({ currentUser: null, token: null, isAuthenticated: false, isInitializing: false });
      return false;
    }

    try {
      const userData = await apiService.getCurrentUser();
      if (!userData || (!userData.username && !userData.email)) {
        throw new Error('Invalid user payload');
      }

      const roleEnum = (userData.role as UserRole) || 'ROLE_ADMIN';
      set({
        currentUser: {
          id: `USR-${userData.userId || '101'}`,
          username: userData.username,
          name: userData.name || userData.username.toUpperCase(),
          email: userData.email || `${userData.username}@rakshasphere.internal`,
          role: roleEnum,
          avatar: userData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        },
        token: storedToken,
        isAuthenticated: true,
        isInitializing: false
      });
      return true;
    } catch (err) {
      localStorage.removeItem('rakshasphere_token');
      sessionStorage.removeItem('rakshasphere_token');
      set({ currentUser: null, token: null, isAuthenticated: false, isInitializing: false });
      return false;
    }
  },

  loginAsync: async (username: string, password: string, mfaCode?: string, rememberMe: boolean = true) => {
    try {
      const res = await apiService.login(username, password, mfaCode);
      const token = res.token || res.jwt;

      if (!token) {
        throw new Error('Authentication failed: Invalid credentials');
      }

      const roleEnum = (res.role as UserRole) || 'ROLE_ADMIN';

      if (typeof window !== 'undefined') {
        localStorage.removeItem('rakshasphere_token');
        sessionStorage.removeItem('rakshasphere_token');
        if (rememberMe) {
          localStorage.setItem('rakshasphere_token', token);
        } else {
          sessionStorage.setItem('rakshasphere_token', token);
        }
      }

      set({
        currentUser: {
          id: `USR-${res.userId || '101'}`,
          username: res.username || username,
          name: res.name || (res.username || username).toUpperCase(),
          email: res.email || `${res.username || username}@rakshasphere.internal`,
          role: roleEnum,
          avatar: res.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        },
        token,
        isAuthenticated: true,
        isInitializing: false
      });
      return true;
    } catch (err: any) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('rakshasphere_token');
        sessionStorage.removeItem('rakshasphere_token');
      }
      set({
        currentUser: null,
        token: null,
        isAuthenticated: false,
        isInitializing: false
      });
      throw new Error(err.message || 'Invalid username or password');
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rakshasphere_token');
      sessionStorage.removeItem('rakshasphere_token');
    }
    set({ currentUser: null, token: null, isAuthenticated: false, isInitializing: false });
  },

  hasRole: (role: UserRole) => {
    const { currentUser } = get();
    if (!currentUser) return false;
    return currentUser.role === role;
  },

  canPerformAction: (action) => {
    const { currentUser } = get();
    if (!currentUser) return false;
    const role = currentUser.role;

    switch (action) {
      case 'MANAGE_USERS':
      case 'MANAGE_SETTINGS':
        return role === 'ROLE_ADMIN';
      case 'REMEDIATE':
      case 'DEPLOY_HONEYPOT':
      case 'VIEW_AUDIT':
        return role === 'ROLE_ADMIN' || role === 'ROLE_SOC_ANALYST';
      default:
        return false;
    }
  }
}));
