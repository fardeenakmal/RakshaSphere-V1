# RakshaSphere — Threat Intelligence Integration

> **Source of truth:** `ThreatIntelService.java`, `ThreatIntelHealthIndicator.java`, `AlertController.java`, `SecurityAlertService.java`.

---

## Overview

The `ThreatIntelService` enriches incoming security alerts with real-world IP reputation, geolocation, and ISP metadata. It connects asynchronously to two external threat intelligence providers:

1. **VirusTotal v3 API** — IP address threat analysis reports (`https://www.virustotal.com/api/v3/ip_addresses/{ip}`)
2. **AbuseIPDB v2 API** — IP reputation and confidence-of-abuse scores (`https://api.abuseipdb.com/api/v2/check?ipAddress={ip}`)

---

## Reactive Enrichment Pipeline

Enrichment is executed reactively using Spring WebFlux `WebClient` and `Mono.zip()`:

```
                  ┌──────────────────────┐
                  │ SecurityAlert Ingest │
                  └──────────┬───────────┘
                             │ Source IP
                             ▼
                 ThreatIntelService.enrichIpData()
                             │
              Is IP RFC1918 / Localhost Loopback?
                             ├───────────────────────┐
                     [Yes]   │                       │ [No]
                             ▼                       ▼
                   Internal IP Metadata    Mono.zip(VT, AbuseIPDB)
                   - VT: "INTERNAL_IP"      ├── fetchVirusTotalData()
                   - Abuse: "N/A"           └── fetchAbuseIpDbData()
                   - Geo: "Internal Net"             │
                   - ISP: "Local Infra"              ▼
                                            Merged Threat Metadata
                                            - virusTotalScore
                                            - abuseIpDbConfidence
                                            - geoCountry
                                            - ispName
```

---

## Provider Integration Details

### 1. VirusTotal v3 API
- **Endpoint:** `GET https://www.virustotal.com/api/v3/ip_addresses/{ip}`
- **Authentication:** `x-apikey: ${threat-intel.virustotal.api-key}`
- **Timeout:** 4 seconds with exponential backoff retry (2 attempts, 500ms initial interval)
- **Extracted Fields:**
  - `data.attributes.last_analysis_stats` → Evaluates malicious vs total engines (`"X/90 Malicious"` or `"Clean"`)
  - `data.attributes.country` → Geolocation country code
  - `data.attributes.as_owner` → Autonomous system / ISP name
- **Error Codes:** Handles `401 Unauthorized`, `403 Forbidden`, `429 Rate Limited`, mapping each to explicit status strings.

### 2. AbuseIPDB v2 API
- **Endpoint:** `GET https://api.abuseipdb.com/api/v2/check?ipAddress={ip}`
- **Authentication:** `Key: ${threat-intel.abuseipdb.api-key}`
- **Timeout:** 4 seconds with exponential backoff retry (2 attempts)
- **Extracted Fields:**
  - `data.abuseConfidenceScore` → Confidence score from `0` to `100`
  - `data.countryCode` → Country code
  - `data.isp` → Internet Service Provider
- **Error Codes:** Explicit mapping for `401`, `403`, and `429`.

---

## Internal & Private IP Handling

The service checks for RFC 1918 private subnets and loopback addresses:
- `192.168.x.x`
- `10.x.x.x`
- `172.16.x.x`
- `127.0.0.1` and `::1`

When detected, external HTTP requests are **bypassed completely**, returning deterministic local infrastructure metadata instantly without network latency.

---

## Health & Key Status Monitoring (`ThreatIntelHealthIndicator`)

The Spring Boot Actuator health endpoint tracks API key status:
- **`CONFIGURED`** — Valid API key string is present in environment/config.
- **`NOT_CONFIGURED`** — Key is blank or missing.
- **Health Status:**
  - If both keys are configured: `UP`
  - If one key is configured: `DEGRADED`
  - If neither is configured: `UNAVAILABLE`
