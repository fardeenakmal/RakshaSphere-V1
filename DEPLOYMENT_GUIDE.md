# RAKSHASPHERE — PRODUCTION DEPLOYMENT GUIDE

**Version:** `1.0.0-RELEASE`  
**Target OS:** Ubuntu 22.04 LTS / Debian 12 / RHEL 9 / Linux Kernel 5.15+

---

## 1. Environment & Hardware Requirements

### Minimum Hardware Allocation
- **CPU Cores:** 4 Cores (x86_64 or ARM64)
- **System Memory:** 8 GB RAM
- **Storage:** 40 GB NVMe / SSD Storage
- **Network Interface:** 1 Gbps Ethernet NIC

### Software Dependencies
- **Docker Engine:** `v25.0.0+`
- **Docker Compose:** `v2.24.0+`
- **Node.js:** `v20.x` (For local frontend development)
- **Java Development Kit:** `OpenJDK 21 LTS` (For local backend development)
- **Python:** `v3.11+` (For local AI & IoT agent scripts)

---

## 2. Environment Configuration Setup

1. Clone the production repository:
```bash
git clone https://github.com/fardeenakmal/RakshaSphere-V1.git
cd RakshaSphere-V1
```

2. Generate production environment configuration:
```bash
cp docker/.env.example docker/.env
```

3. Update `docker/.env` with strong production credentials:
```env
# Database Configuration
MYSQL_ROOT_PASSWORD=Set_A_Strong_Root_Password_Here
MYSQL_DATABASE=rakshaspheredb
MYSQL_USER=raksha_user
MYSQL_PASSWORD=Set_A_Strong_User_Password_Here

# JWT Configuration (MUST be at least 32 characters / 256 bits long)
JWT_SECRET=Set_A_Strong_Random_Secret_Key_At_Least_256_Bits_Long_1234567890
JWT_EXPIRATION_MS=86400000

# Backend & Public Endpoints
FRONTEND_URL=http://localhost:3000
RATE_LIMIT_MAX_REQUESTS=100

# External Threat Intelligence APIs (Optional)
ABUSEIPDB_API_KEY=your_abuseipdb_key_here
VIRUSTOTAL_API_KEY=your_virustotal_key_here

# Deception Honeypot Key
HONEYPOT_MANAGER_API_KEY=your_honeypot_manager_api_key_here
```

---

## 3. Container Deployment Execution

Launch all services via Docker Compose:

```bash
# Build images and start container suite in detached mode
docker compose -f docker/docker-compose.yml up --build -d
```

### Verify Container Health & Status
```bash
docker compose -f docker/docker-compose.yml ps
```

All core containers should display state `running` or `healthy`:
- `raksha-mysql` (`healthy`)
- `raksha-redis` (`healthy`)
- `raksha-mosquitto` (`running`)
- `raksha-ai-engine` (`healthy`)
- `raksha-backend` (`healthy`)
- `raksha-frontend` (`running`)
- `raksha-honeypot-manager` (`healthy`)

---

## 4. Default Application Access Credentials

Once containers report healthy status:

| Gateway | URL | Default Username | Default Password |
|---|---|---|---|
| **SOC Dashboard** | `http://localhost:3000` | `admin` | `Admin@Raksha2026!` |
| **Backend REST API** | `http://localhost:8080/api/v1` | N/A | JWT Bearer Token |
| **Actuator Health** | `http://localhost:8080/actuator/health` | N/A | Public |
| **AI Inference API** | `http://localhost:5000/docs` | N/A | Open |

> **SECURITY NOTE:** Immediately log in as `admin` and change the default password in **Settings → User Governance**.

---

## 5. Database Backup & Restore Operations

### Manual Database Snapshot Export
```bash
docker exec -t raksha-mysql mysqldump -u raksha_user -pchange_this_user_password rakshaspheredb > docker/backups/manual-backup-$(date +%Y%m%d).sql
```

### Database Snapshot Restore
```bash
docker exec -i raksha-mysql mysql -u raksha_user -pchange_this_user_password rakshaspheredb < docker/backups/manual-backup-20260815.sql
```

---

## 6. Subsystem Verification & Troubleshooting

- **Check Backend Logs:** `docker logs -f raksha-backend`
- **Check AI Inference Logs:** `docker logs -f raksha-ai-engine`
- **Check Honeypot Manager Logs:** `docker logs -f raksha-honeypot-manager`
- **Check Mosquitto MQTT Logs:** `docker logs -f raksha-mosquitto`
