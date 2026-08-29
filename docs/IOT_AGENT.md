# RakshaSphere — IoT Edge Security Daemon & MQTT Subsystem

> **Source of truth:** `iot-agent/agent.py`, `iot-agent/config.json`, `iot-agent/Dockerfile`, `IotMqttSubscriberService.java`, `IotDevice.java`, `IotTelemetryLog.java`.

---

## Subsystem Overview

The IoT Edge Subsystem is composed of:
1. **IoT Agent Daemon (`iot-agent/agent.py`)** — A Python process simulating an edge IoT gateway device by collecting host metrics and evaluating local anomaly thresholds.
2. **MQTT Message Broker (Eclipse Mosquitto)** — Running on port `1883` to route telemetry and command messages between edge devices and the central backend.
3. **Backend MQTT Consumer (`IotMqttSubscriberService.java`)** — A Spring Boot service using the Eclipse Paho MQTT client that subscribes to device telemetry and persists it to MySQL.

---

## IoT Agent Daemon (`agent.py`)

### Architecture
- **Language:** Python 3.11+
- **Library:** `paho-mqtt` (v2 API with fallback to v1 API), `requests` (optional HTTP telemetry fallback)
- **Configuration:** `iot-agent/config.json`

### Telemetry Sampling (`EdgeMetricsSampler`)
The sampler collects real system metrics from the host environment:
- **CPU Utilization:** Calculated by reading `/proc/stat` delta over a sampling interval (or via `psutil` if installed; falls back to pseudo-random simulation if neither is available).
- **Memory Utilization:** Parsed directly from `/proc/meminfo` (`MemTotal` vs `MemAvailable`).
- **Active Sockets:** Counted by inspecting Linux kernel socket tables: `/proc/net/tcp`, `/proc/net/tcp6`, `/proc/net/udp`.
- **Latency & Signal:** Connection metrics formatted for SOC telemetry reporting.

### Telemetry Payload Schema

```json
{
  "deviceId": "EDGE-GW-001",
  "timestamp": "2026-08-18T12:00:00Z",
  "cpuUsagePct": 18.5,
  "memoryUsagePct": 42.1,
  "networkStats": {
    "activeSockets": 14,
    "rxPacketsPerSec": 0,
    "txPacketsPerSec": 0,
    "droppedPackets": 0
  },
  "connectionQuality": {
    "latencyMs": 1.0,
    "signalStrengthDbm": -60
  }
}
```

### Edge Anomaly Detection (`EdgeAnomalyDetector`)
The agent evaluates two rule-based threshold checks locally before transmission:
- **CPU Spike Anomaly:** Triggers if `cpuUsagePct > maxCpuPctThreshold` (Default: `90.0%`).
- **Socket Flood Anomaly:** Triggers if `activeSockets > maxSocketsThreshold` (Default: `100`).

---

## MQTT Communication Channels

| Topic | Publisher | Subscriber | QoS | Purpose |
|---|---|---|---|---|
| `rakshasphere/devices/{deviceId}/telemetry` | IoT Agent | Backend | 1 | Periodic real-time metrics telemetry payload |
| `rakshasphere/devices/{deviceId}/status` | IoT Agent | Backend | 1 (Retained) | Device lifecycle status (`ONLINE` or `OFFLINE` via LWT) |
| `rakshasphere/devices/{deviceId}/commands` | Backend / Operator | IoT Agent | 1 | Control directives sent to the edge agent |

### Last Will and Testament (LWT)
Upon connecting to Mosquitto, the agent registers an LWT message on `rakshasphere/devices/{deviceId}/status`:
```json
{
  "status": "OFFLINE",
  "reason": "DAEMON_TERMINATED",
  "deviceId": "EDGE-GW-001"
}
```
If the broker detects unexpected agent disconnection, it automatically publishes this payload to inform the backend.

---

## Backend Ingestion (`IotMqttSubscriberService`)

The backend connects to Mosquitto on startup (`ApplicationReadyEvent`) using client ID `backend_iot_consumer_<uuid>`:

1. **Subscription:** Subscribes with wildcard patterns:
   - `rakshasphere/devices/+/telemetry`
   - `rakshasphere/devices/+/status`
2. **Telemetry Ingestion:**
   - Deserializes JSON payload into `IotTelemetryDto`.
   - Records receipt timestamp in `MqttHealthIndicator` for health observability.
   - Upserts device record into `iot_devices` table (updates status to `ONLINE`, CPU, RAM, active sockets, and `lastHeartbeat`).
   - Appends historical telemetry sample to `iot_telemetry_logs` table.
3. **Status Changes:**
   - Updates `iot_devices.status` in the database.
   - Forwards status change events over STOMP WebSocket to `/topic/alerts`.

---

## Standalone Execution

To execute the IoT Agent in standalone or single-cycle test mode:

```bash
# Run 2 test cycles and exit
python3 /home/fardeen/RakshaSphere/iot-agent/agent.py --single

# Run continuous loop (Ctrl+C to stop)
python3 /home/fardeen/RakshaSphere/iot-agent/agent.py
```
