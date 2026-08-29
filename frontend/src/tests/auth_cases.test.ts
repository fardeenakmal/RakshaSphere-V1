/**
 * Comprehensive Authentication & Session-Routing Test Suite
 * Validating Cases A - H
 */

import { useAuthStore } from '../store/useAuthStore';
import { apiService } from '../services/api';

// In-memory Storage mock
class MockStorage implements Storage {
  private store: Map<string, string> = new Map();
  get length() { return this.store.size; }
  clear() { this.store.clear(); }
  getItem(key: string) { return this.store.get(key) ?? null; }
  key(index: number) { return Array.from(this.store.keys())[index] ?? null; }
  removeItem(key: string) { this.store.delete(key); }
  setItem(key: string, value: string) { this.store.set(key, String(value)); }
}

const mockLocalStorage = new MockStorage();
const mockSessionStorage = new MockStorage();

// Setup global browser mocks
(global as any).window = global;
(global as any).localStorage = mockLocalStorage;
(global as any).sessionStorage = mockSessionStorage;

// Assert helper
function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ ${msg}`);
}

async function runTests() {
  console.log('\n========================================');
  console.log('  RAKSHASPHERE AUTH SUITE (CASES A - H) ');
  console.log('========================================\n');

  // Reset store helper
  const resetStore = () => {
    mockLocalStorage.clear();
    mockSessionStorage.clear();
    useAuthStore.setState({
      currentUser: null,
      token: null,
      isAuthenticated: false,
      isInitializing: true,
    });
  };

  // ----------------------------------------------------
  // CASE A: New browser/device (No stored token)
  // ----------------------------------------------------
  console.log('▶ TEST CASE A: New browser/device (No token in storage)');
  resetStore();
  {
    // When user opens /, initializeAuth runs
    const initialized = await useAuthStore.getState().initializeAuth();
    const state = useAuthStore.getState();

    assert(initialized === false, 'initializeAuth returns false');
    assert(state.isAuthenticated === false, 'isAuthenticated is false');
    assert(state.isInitializing === false, 'isInitializing is false');
    assert(state.currentUser === null, 'currentUser is null');
    assert(state.token === null, 'token is null');
    assert(mockLocalStorage.getItem('rakshasphere_token') === null, 'No token in localStorage');
    assert(mockSessionStorage.getItem('rakshasphere_token') === null, 'No token in sessionStorage');

    // Simulate page.tsx logic:
    let route = '';
    if (!state.isInitializing) {
      route = state.isAuthenticated ? '/dashboard' : '/login';
    }
    assert(route === '/login', 'Root / redirects to /login, Dashboard does NOT appear');
  }

  // ----------------------------------------------------
  // CASE B: Invalid / Stale token
  // ----------------------------------------------------
  console.log('\n▶ TEST CASE B: Invalid / stale token');
  resetStore();
  {
    mockLocalStorage.setItem('rakshasphere_token', 'invalid_expired_jwt_xyz');

    // Mock fetch to simulate 401 Unauthorized for /auth/me
    const originalFetch = global.fetch;
    global.fetch = async (url: any, opts: any) => {
      if (String(url).includes('/auth/me')) {
        return {
          ok: false,
          status: 401,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: false, message: 'Invalid or expired token' }),
        } as any;
      }
      return { ok: true, json: async () => ({}) } as any;
    };

    const initialized = await useAuthStore.getState().initializeAuth();
    const state = useAuthStore.getState();

    assert(initialized === false, 'initializeAuth returns false on 401 /auth/me');
    assert(state.isAuthenticated === false, 'isAuthenticated is false');
    assert(state.isInitializing === false, 'isInitializing is false');
    assert(state.currentUser === null, 'currentUser is null');
    assert(state.token === null, 'token is null');
    assert(mockLocalStorage.getItem('rakshasphere_token') === null, 'Invalid token removed from localStorage');
    assert(mockSessionStorage.getItem('rakshasphere_token') === null, 'Token cleared from sessionStorage');

    // Restore fetch
    global.fetch = originalFetch;
  }

  // ----------------------------------------------------
  // CASE C: Valid token (Login with backend credentials)
  // ----------------------------------------------------
  console.log('\n▶ TEST CASE C: Valid token login flow');
  resetStore();
  {
    const validJwt = 'valid_signed_jwt_admin_token_123';
    const mockUserPayload = {
      token: validJwt,
      username: 'admin',
      name: 'SOC Administrator',
      email: 'admin@rakshasphere.internal',
      role: 'ROLE_ADMIN',
      avatar: 'https://avatar.url',
    };

    const originalFetch = global.fetch;
    global.fetch = async (url: any, opts: any) => {
      const urlStr = String(url);
      if (urlStr.includes('/auth/login')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true, data: mockUserPayload }),
        } as any;
      }
      if (urlStr.includes('/auth/me')) {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true, data: mockUserPayload }),
        } as any;
      }
      return { ok: true, json: async () => ({}) } as any;
    };

    const success = await useAuthStore.getState().loginAsync('admin', 'ValidPassword123!', undefined, true);
    const state = useAuthStore.getState();

    assert(success === true, 'loginAsync returns true on valid credentials');
    assert(state.isAuthenticated === true, 'isAuthenticated is true');
    assert(state.isInitializing === false, 'isInitializing is false');
    assert(state.token === validJwt, 'Store token matches valid JWT');
    assert(state.currentUser?.username === 'admin', 'currentUser populated accurately');
    assert(state.currentUser?.role === 'ROLE_ADMIN', 'User role correctly assigned');
    assert(mockLocalStorage.getItem('rakshasphere_token') === validJwt, 'Token stored in localStorage (Remember Me ON)');

    // Next simulated navigation
    let nextRoute = state.isAuthenticated ? '/dashboard' : '/login';
    assert(nextRoute === '/dashboard', 'Navigation leads to /dashboard on valid login');

    global.fetch = originalFetch;
  }

  // ----------------------------------------------------
  // CASE D: Logout
  // ----------------------------------------------------
  console.log('\n▶ TEST CASE D: Logout flow');
  {
    // Currently authenticated from Case C
    assert(useAuthStore.getState().isAuthenticated === true, 'Precondition: Currently authenticated');

    useAuthStore.getState().logout();
    const state = useAuthStore.getState();

    assert(state.isAuthenticated === false, 'isAuthenticated set to false');
    assert(state.currentUser === null, 'currentUser set to null');
    assert(state.token === null, 'token set to null');
    assert(mockLocalStorage.getItem('rakshasphere_token') === null, 'localStorage cleared on logout');
    assert(mockSessionStorage.getItem('rakshasphere_token') === null, 'sessionStorage cleared on logout');

    // Simulate browser refresh (re-initializeAuth)
    const reInit = await useAuthStore.getState().initializeAuth();
    const refreshedState = useAuthStore.getState();

    assert(reInit === false, 'After refresh, initializeAuth returns false');
    assert(refreshedState.isAuthenticated === false, 'Still unauthenticated after refresh');
    assert(refreshedState.currentUser === null, 'Still no user after refresh');
  }

  // ----------------------------------------------------
  // CASE E: Remember Me OFF (sessionStorage only)
  // ----------------------------------------------------
  console.log('\n▶ TEST CASE E: Remember Me OFF (sessionStorage only)');
  resetStore();
  {
    const validJwt = 'session_only_token_456';
    const mockUserPayload = {
      token: validJwt,
      username: 'analyst_mike',
      name: 'Mike Analyst',
      email: 'analyst@rakshasphere.internal',
      role: 'ROLE_SOC_ANALYST',
    };

    const originalFetch = global.fetch;
    global.fetch = async (url: any, opts: any) => {
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: mockUserPayload }),
      } as any;
    };

    await useAuthStore.getState().loginAsync('analyst_mike', 'ValidPassword123!', undefined, false);
    const state = useAuthStore.getState();

    assert(state.isAuthenticated === true, 'Authenticated successfully');
    assert(mockSessionStorage.getItem('rakshasphere_token') === validJwt, 'Token exists in sessionStorage');
    assert(mockLocalStorage.getItem('rakshasphere_token') === null, 'Token does NOT exist in localStorage');

    global.fetch = originalFetch;
  }

  // ----------------------------------------------------
  // CASE F: Remember Me ON (localStorage only)
  // ----------------------------------------------------
  console.log('\n▶ TEST CASE F: Remember Me ON (localStorage only)');
  resetStore();
  {
    const validJwt = 'remember_me_token_789';
    const mockUserPayload = {
      token: validJwt,
      username: 'admin',
      role: 'ROLE_ADMIN',
    };

    const originalFetch = global.fetch;
    global.fetch = async (url: any, opts: any) => {
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, data: mockUserPayload }),
      } as any;
    };

    await useAuthStore.getState().loginAsync('admin', 'ValidPassword123!', undefined, true);
    const state = useAuthStore.getState();

    assert(state.isAuthenticated === true, 'Authenticated successfully');
    assert(mockLocalStorage.getItem('rakshasphere_token') === validJwt, 'Token exists in localStorage');
    assert(mockSessionStorage.getItem('rakshasphere_token') === null, 'Token does NOT exist in sessionStorage');

    global.fetch = originalFetch;
  }

  // ----------------------------------------------------
  // CASE G: Direct dashboard URL (AuthGuard check)
  // ----------------------------------------------------
  console.log('\n▶ TEST CASE G: Direct dashboard URL access with no token');
  resetStore();
  {
    // AuthGuard execution simulation
    const initResult = await useAuthStore.getState().initializeAuth();
    const state = useAuthStore.getState();

    // Guard evaluation:
    let guardAllowed = false;
    let guardRedirect = '';

    if (!state.isInitializing) {
      if (!state.isAuthenticated) {
        guardRedirect = '/login';
        guardAllowed = false;
      } else {
        guardAllowed = true;
      }
    }

    assert(guardAllowed === false, 'AuthGuard blocks rendering dashboard children');
    assert(guardRedirect === '/login', 'AuthGuard triggers redirect to /login');
  }

  // ----------------------------------------------------
  // CASE H: Mobile / Private browser
  // ----------------------------------------------------
  console.log('\n▶ TEST CASE H: Mobile/private browser (Fresh session)');
  resetStore();
  {
    // In incognito or private browsing, storage is completely empty
    const initResult = await useAuthStore.getState().initializeAuth();
    const state = useAuthStore.getState();

    let initialView = '';
    if (!state.isInitializing) {
      initialView = state.isAuthenticated ? '/dashboard' : '/login';
    }

    assert(initResult === false, 'No session recognized in private browser');
    assert(state.isAuthenticated === false, 'Session is unauthenticated');
    assert(initialView === '/login', 'Login page appears first to private/mobile visitor');
  }

  // ----------------------------------------------------
  // CASE I: Skip Login / View-Only Mode
  // ----------------------------------------------------
  console.log('\n▶ TEST CASE I: Skip Login / View-Only Mode');
  resetStore();
  {
    // User clicks "Skip Login — View Only Mode"
    useAuthStore.getState().skipLogin();
    const stateAfterSkip = useAuthStore.getState();

    assert(stateAfterSkip.isAuthenticated === true, 'skipLogin sets isAuthenticated to true');
    assert(stateAfterSkip.currentUser !== null, 'skipLogin populates guest currentUser');
    assert(stateAfterSkip.currentUser?.role === 'ROLE_USER', 'Guest user has ROLE_USER (view-only role)');
    assert(mockSessionStorage.getItem('rakshasphere_token') === 'guest_view_only_token', 'Guest token saved in sessionStorage');
    assert(useAuthStore.getState().canPerformAction('REMEDIATE') === false, 'View-only user cannot perform destructive actions');

    // Simulate page refresh in view-only session
    useAuthStore.setState({ isInitializing: true, isAuthenticated: false, currentUser: null });
    const restored = await useAuthStore.getState().initializeAuth();
    const stateAfterRefresh = useAuthStore.getState();

    assert(restored === true, 'initializeAuth restores guest session');
    assert(stateAfterRefresh.isAuthenticated === true, 'Restored session is authenticated');
    assert(stateAfterRefresh.currentUser?.role === 'ROLE_USER', 'Restored user retains ROLE_USER');

    // Logout clears guest session
    useAuthStore.getState().logout();
    assert(useAuthStore.getState().isAuthenticated === false, 'Logout terminates guest session');
    assert(mockSessionStorage.getItem('rakshasphere_token') === null, 'Session storage cleared on logout');
  }

  console.log('\n========================================');
  console.log('  ALL 9 TEST CASES (A - I) PASSED! 🎉  ');
  console.log('========================================\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

