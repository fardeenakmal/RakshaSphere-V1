import { create } from 'zustand';
import { type User, type UserRole } from '@/types';
import { apiService } from '@/services/api';

interface AuthState {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loginAsync: (username: string, password: string, mfaCode?: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  canPerformAction: (action: 'REMEDIATE' | 'DEPLOY_HONEYPOT' | 'MANAGE_USERS' | 'MANAGE_SETTINGS' | 'VIEW_AUDIT') => boolean;
}

export const DEFAULT_USER: User = {
  id: 'USR-101',
  username: 'admin',
  name: 'System Administrator',
  email: 'admin@rakshasphere.internal',
  role: 'ROLE_ADMIN',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
};

const initialToken = typeof window !== 'undefined' ? localStorage.getItem('rakshasphere_token') : null;

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: initialToken ? DEFAULT_USER : null,
  token: initialToken,
  isAuthenticated: Boolean(initialToken),


  loginAsync: async (username: string, password: string, mfaCode?: string) => {
    try {
      const res = await apiService.login(username, password, mfaCode);
      const token = res.token || res.jwt;

      if (!token) {
        throw new Error('Authentication failed: Invalid credentials');
      }

      const roleEnum = (res.role as UserRole) || 'ROLE_ADMIN';

      if (typeof window !== 'undefined') {
        localStorage.setItem('rakshasphere_token', token);
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
        isAuthenticated: true
      });
      return true;
    } catch (err: any) {
      set({
        currentUser: null,
        token: null,
        isAuthenticated: false
      });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('rakshasphere_token');
      }
      throw new Error(err.message || 'Invalid username or password');
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rakshasphere_token');
    }
    set({ currentUser: null, token: null, isAuthenticated: false });
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
