# RakshaSphere — Testing & Verification Guide

> **Source of truth:** `backend/src/test/`, `frontend/src/tests/`, `ai-engine/tests/`.

---

## Testing Strategy

RakshaSphere maintains test suites across the frontend client layer, Java Spring backend, and Python AI pipeline.

---

## 1. Backend Testing (JUnit 5 & SpringBootTest)

Location: `backend/src/test/java/com/rakshasphere/RakshaSphereApplicationTests.java`

### Executing Backend Tests
```bash
cd /home/fardeen/RakshaSphere/backend
./mvnw test
```

### Test Coverage Areas
- **Spring Context Loading:** Verifies all beans (`AuthenticationService`, `ThreatIntelService`, `SystemHealthService`, repositories) initialize without cyclic dependencies or configuration errors.
- **Admin Authentication:** Tests valid login credentials returning expected user roles and signed JWT strings.
- **Security Rejections:** Asserts `BadCredentialsException` (HTTP 401) is thrown for invalid passwords and non-existent usernames.
- **System Metrics Extraction:** Verifies that JVM uptime, host CPU cores, RAM statistics, and OS metadata are properly extracted from the local runtime.

---

## 2. Frontend Authentication & Session Test Suite

Location: `frontend/src/tests/auth_cases.test.ts`

### Executing Frontend Tests
```bash
cd /home/fardeen/RakshaSphere/frontend
npx tsx src/tests/auth_cases.test.ts
```

### Validated Test Cases
- **Case A:** Login with Remember Me (`localStorage` persistence).
- **Case B:** Login without Remember Me (`sessionStorage` persistence).
- **Case C:** Auth initialization on page refresh with valid stored token.
- **Case D:** Auth initialization failure with invalid/expired token.
- **Case E:** Immediate token invalidation and redirection on HTTP 401/403.
- **Case F:** Explicit logout clearing all browser storage layers.
- **Case G:** Role-based UI rendering via `PermissionGuard`.
- **Case H:** Action permission validation via `canPerformAction()`.

---

## 3. AI Engine Verification

Location: `ai-engine/inference_server.py`, `ai-engine/inference/pipeline.py`

### Testing AI Inference Pipeline
```bash
# 1. Health & Manifest Check
curl -s http://localhost:5000/health | jq .

# 2. Test Prediction with Sample Vector (84 floats)
curl -s -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"flowFeatures": [450.0, 120.0, 512.0, 0.85, 5.0, 5.0, 0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "topK": 5}' | jq .
```

---

## 4. IoT Agent Dry Run

```bash
python3 /home/fardeen/RakshaSphere/iot-agent/agent.py --single
```
Executes two sampling cycles, tests `/proc` metrics extraction, performs edge anomaly evaluation, and shuts down cleanly.
