# RakshaSphere — Frontend Architecture & Developer Guide

> **Source of truth:** `frontend/src/`, `frontend/package.json`, `frontend/next.config.ts`, `api.ts`, and Zustand store files.

---

## Technology Stack

- **Framework:** Next.js 15.x (React 19 / App Router)
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS + Vanilla CSS tokens (`globals.css`)
- **State Management:** Zustand (`useAlertStore`, `useAuthStore`, `useHealthStore`, `useUIStore`)
- **Icons:** `lucide-react`
- **Real-Time Client:** `@stomp/stompjs` + `sockjs-client`

---

## Route Structure

```
frontend/src/app/
├── layout.tsx                     Root HTML / Theme wrapper
├── page.tsx                       Landing redirect to /dashboard or /login
├── globals.css                    Dark cybernetic theme design system
├── (auth)/
│   ├── login/page.tsx             Authentication portal with MFA modal support
│   └── request-access/page.tsx    Access registration workflow
└── (dashboard)/
    ├── layout.tsx                 Protected layout with AuthGuard, Sidebar, Navbar
    ├── dashboard/page.tsx         Master SOC executive radar & telemetry feed
    ├── alerts/page.tsx            Security alert triage & remediation console
    ├── mitre/page.tsx             MITRE ATT&CK enterprise matrix visualization
    ├── honeypots/page.tsx         Cowrie deception sandbox terminal & session list
    ├── system-health/page.tsx     Live component health probe matrix & host stats
    └── settings/page.tsx          Admin settings & user approval management
```

---

## State Management Architecture (Zustand)

### 1. `useAuthStore.ts`
- Manages authentication token (`localStorage` / `sessionStorage`), current user profile, and initialization state.
- Exposes permission verification methods: `hasRole(role)` and `canPerformAction(action)`.
- Handles session invalidation upon receiving `401` or `403` API responses.

### 2. `useAlertStore.ts`
- Holds active alerts list, search query, severity filter, and status filter.
- Dispatches remediation actions: `containAlert()`, `divertToHoneypot()`, `resolveAlert()`, `revertAction()`.
- Optimistically updates UI state and incorporates live incoming alerts pushed via WebSocket.

### 3. `useHealthStore.ts`
- Tracks overall system status, individual microservice health states, and system resource metrics (CPU, RAM, Disk).
- Periodically polls `GET /api/v1/system/health` and `GET /api/v1/system/info`.

### 4. `useUIStore.ts`
- Controls sidebar collapsed state, notification drawer toggles, and modal visibility.

---

## Real-Time WebSocket / STOMP Integration

The frontend connects to the Spring Boot STOMP broker at `http://localhost:8080/ws-soc`:
- Connects using a SockJS client transport.
- Supplies the JWT token in the `Authorization: Bearer <token>` header of the STOMP `CONNECT` frame.
- Subscribes to:
  - `/topic/alerts` — Ingests live threat classifications and edge anomalies into `useAlertStore`.
  - `/topic/honeypot-events` — Streams keystrokes and attacker probes into active terminal views.

---

## Security & Route Guards

- **`AuthGuard.tsx`:** Validates existing session by invoking `initializeAuth()` (calling `GET /api/v1/auth/me`). Redirects unauthenticated users to `/login`.
- **`PermissionGuard.tsx`:** Conditionally displays management controls or action buttons based on user role (`ROLE_ADMIN`, `ROLE_SOC_ANALYST`, `ROLE_USER`).

---

## Local Development Execution

```bash
cd /home/fardeen/RakshaSphere/frontend
npm install
npm run dev
```
The application will be available at `http://localhost:3000`.
