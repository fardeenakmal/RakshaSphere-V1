# RakshaSphere — Authentication & RBAC

> **Source of truth:** `SecurityConfig.java`, `JwtTokenProvider.java`, `AuthController.java`, `AuthenticationService.java`, `useAuthStore.ts`, `AuthGuard.tsx`, `PermissionGuard.tsx`.

---

## Authentication Model

RakshaSphere uses **stateless JWT-based authentication**. There are no server-side sessions. Every request must carry a valid Bearer token.

---

## Backend Login Flow

```
POST /api/v1/auth/login
  { username, password, mfaCode? }
           │
           ▼
  AuthenticationService.authenticate()
           │
           ├─ Spring AuthenticationManager.authenticate()
           │        → CustomUserDetailsService.loadUserByUsername()
           │        → BCryptPasswordEncoder.matches()
           │
           ├─ If user.status != ACTIVE → throw "Account pending approval"
           │
           ├─ [Optional] If user.mfaEnabled → verify TOTP code via MfaService
           │
           ▼
  JwtTokenProvider.generateToken()
    → HMAC-SHA256 signed JWT
    → Subject: username
    → Expiry: 24 hours (default, configurable via JWT_EXPIRATION_MS)
           │
           ▼
  Returns: { token, username, role, name }
```

---

## JWT Configuration

| Property | Default Value | Environment Variable |
|----------|--------------|---------------------|
| Secret key | `9a8b7c6d5e4f3a2b...` (64 hex chars) | `JWT_SECRET` |
| Expiration | 86400000 ms (24 hours) | `JWT_EXPIRATION_MS` |
| Algorithm | HMAC-SHA256 | — |
| Minimum secret length | 32 bytes | — (enforced at startup) |

> **Important:** The default secret is a hardcoded development secret. For any real deployment, `JWT_SECRET` must be overridden with a random 256-bit secret.

---

## Token Validation

Every request to a protected endpoint passes through `JwtAuthenticationFilter`:

1. Extract `Authorization: Bearer <token>` header
2. Call `JwtTokenProvider.validateToken(token)` — catches `ExpiredJwtException`, `MalformedJwtException`, etc.
3. Extract `username` from claims
4. Load `UserDetails` from database
5. Set `UsernamePasswordAuthenticationToken` in `SecurityContextHolder`

---

## Frontend Session Management

**Token storage (useAuthStore.ts):**

| Remember Me | Storage Location |
|-------------|-----------------|
| `true` (default) | `localStorage` key: `rakshasphere_token` |
| `false` | `sessionStorage` key: `rakshasphere_token` |

**Token lifecycle:**

- On login: token stored in `localStorage` or `sessionStorage`
- On every API request: `fetchApi()` reads token from storage, adds `Authorization: Bearer` header
- On `401` or `403` response: token removed from storage (user forced to re-login)
- On logout: token removed from both storages

**AuthGuard.tsx:**

- Wraps all dashboard routes (via `(dashboard)/layout.tsx`)
- On mount: calls `initializeAuth()` which reads stored token and calls `GET /auth/me`
- If `/auth/me` returns valid user: sets `isAuthenticated: true`
- If `/auth/me` fails or no token: removes stored token, redirects to `/login`
- Shows loading spinner during initialization

---

## RBAC (Role-Based Access Control)

### Roles

| Role | Description |
|------|-------------|
| `ROLE_ADMIN` | Full system access: user management, settings, all alert actions, audit logs |
| `ROLE_SOC_ANALYST` | Triage capabilities: can remediate, deploy honeypots, view audit logs |
| `ROLE_USER` | Read-only: can view alerts, MITRE matrix, dashboard metrics |

### Action Permissions (canPerformAction — useAuthStore.ts)

| Action | ROLE_ADMIN | ROLE_SOC_ANALYST | ROLE_USER |
|--------|-----------|------------------|----------|
| `MANAGE_USERS` | ✅ | ❌ | ❌ |
| `MANAGE_SETTINGS` | ✅ | ❌ | ❌ |
| `REMEDIATE` | ✅ | ✅ | ❌ |
| `DEPLOY_HONEYPOT` | ✅ | ✅ | ❌ |
| `VIEW_AUDIT` | ✅ | ✅ | ❌ |

### Backend RBAC Enforcement

Enforced via `@PreAuthorize` annotations on controller methods:

- `hasAnyRole('ADMIN', 'SOC_ANALYST', 'USER')` — view-only endpoints
- `hasAnyRole('ADMIN', 'SOC_ANALYST')` — action endpoints
- `hasRole('ADMIN')` — user management, settings

**Note:** Spring Security strips the `ROLE_` prefix in `hasRole()` expressions, so `ROLE_ADMIN` is matched by `hasRole('ADMIN')`.

---

## PermissionGuard (Frontend)

`PermissionGuard.tsx` wraps UI elements that should only appear for certain roles:

```tsx
<PermissionGuard allowedRoles={['ROLE_ADMIN', 'ROLE_SOC_ANALYST']}>
  <RemedyButton />
</PermissionGuard>
```

`ROLE_ADMIN` bypasses all permission checks and always sees restricted UI.

---

## Registration / Request Access Workflow

1. User fills `/request-access` form → calls `POST /auth/register`
2. User account created with `status: PENDING`
3. Admin sees pending users in Settings → User Management tab
4. Admin calls `PUT /users/{id}/approve` with desired role
5. User account transitions to `ACTIVE` and can log in

---

## MFA (Multi-Factor Authentication)

MFA is implemented using the **TOTP standard** (RFC 6238 / Google Authenticator compatible) via `dev.samstevens:totp` library.

- **Setup:** `GET /auth/mfa/setup?username=admin` → returns Base32 secret + QR code PNG (data URI)
- **Verification:** `POST /auth/mfa/verify` → validates 6-digit TOTP code
- **Login integration:** `POST /auth/login` accepts optional `mfaCode` field

> **Note:** MFA secret storage in the User entity was not confirmed to be persisted to database in the inspected code — the `AuthenticationService.setupMfa()` / login flow stores secrets in-memory. Runtime verification required for production persistence behavior.

---

## Security Headers (Applied via Spring Security)

| Header | Value |
|--------|-------|
| `X-Frame-Options` | `SAMEORIGIN` |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |

---

## CORS Policy

**Allowed origins (CorsConfig.java + SecurityConfig.java):**

- `http://localhost:*` (all localhost ports)
- `https://localhost:*`
- `https://raksha-sphere-v1.vercel.app`
- `https://raksha-sphere-version10.vercel.app`
- `https://raksha-sphere-*.vercel.app` (wildcard pattern)

Credentials are allowed (`allowCredentials: true`).

---

## Default Credentials (Seeded in init.sql)

| Username | Password | Role |
|----------|----------|------|
| `admin` | `Admin@Raksha2026!` | `ROLE_ADMIN` |
| `analyst_mike` | `Admin@Raksha2026!` | `ROLE_SOC_ANALYST` |

> Both accounts use the same BCrypt hash (`$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeg6Lruj3vjPGga31lW`) which corresponds to `secret`.  
> **This is a well-known hash and must be changed before any demonstration where security matters.**
