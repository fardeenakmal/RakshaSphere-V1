# RakshaSphere — eBPF / XDP Defense Module

> **Source of truth:** `ebpf-collector/collector.py`, `backend/src/main/resources/ebpf/rakshasphere_xdp.bpf.c`, `backend/src/main/java/com/rakshasphere/service/EBpfDriver.java`, `backend/src/main/c/eBpfDriver.c`, `EBpfHealthIndicator.java`, `SelfHealingService.java`.

---

## IMPORTANT: Two Separate eBPF Components

This project contains **two distinct eBPF-related implementations** with very different levels of functionality:

| | eBPF Collector (`ebpf-collector/`) | JNI eBPF Driver (`EBpfDriver.java`) |
|--|-----------------------------------|--------------------------------------|
| Type | Real kernel BPF program | JNI stub / simulator |
| Location | Separate Docker container | Spring Boot service + native lib |
| What it does | Loads actual BPF ELF into kernel, reads real BPF map counters | Attempts to load `libebpfdriver.so`; falls back gracefully if not loaded |
| Interface | Dedicated `veth_raksha0` virtual interface | Calls C function via JNI |
| XDP Mode | Generic XDP (`xdpgeneric`) | Simulated (printf to stdout) |
| Health reporting | `/api/ebpf/status` at port 7000 | N/A |
| Container privilege | `privileged: true` | N/A (Java process) |

---

## eBPF Collector Service (ebpf-collector/)

### Purpose
Provides real kernel-level BPF visibility. Loads `rakshasphere_xdp.bpf.o` (pre-compiled BPF ELF from `backend/src/main/resources/ebpf/`) into the Linux kernel and attaches it to a dedicated test interface.

### Startup Process

```
Container starts (privileged mode)
        ↓
ensure_loaded_and_attached()
        ↓
init_veth_pair()
  - ip link add veth_raksha0 type veth peer veth_raksha1
  - ip addr add 10.99.0.1/24 dev veth_raksha0
  - ip addr add 10.99.0.2/24 dev veth_raksha1
  - ip link set up (both)
        ↓
bpftool prog load rakshasphere_xdp.bpf.o /sys/fs/bpf/raksha_xdp_prog type xdp pinmaps /sys/fs/bpf
        ↓
bpftool net attach xdpgeneric pinned /sys/fs/bpf/raksha_xdp_prog dev veth_raksha0
```

> **Note:** The XDP program is attached in **Generic XDP mode** (`xdpgeneric`), which runs in the kernel networking stack after packet allocation (not native/offload mode). This is appropriate for test virtual interfaces.

### Status Reporting (`GET /api/ebpf/status`)

The collector reads live kernel state via:
- `ip link show veth_raksha0` — interface existence
- `bpftool net show dev veth_raksha0` — XDP attachment and mode
- `bpftool prog show pinned /sys/fs/bpf/raksha_xdp_prog` — program details
- `bpftool map show pinned /sys/fs/bpf/xdp_stats_map` — BPF map ID
- `bpftool map dump id {mapId}` — packet/byte counters from the BPF map

### Response Fields

```json
{
  "status": "HEALTHY" | "DEGRADED" | "UNAVAILABLE",
  "attached": true | false,
  "xdpMode": "GENERIC" | "NOT_ATTACHED",
  "interface": "veth_raksha0",
  "packetsTotal": 1024,
  "bytesTotal": 65536,
  "passPackets": 1000,
  "dropPackets": 24,
  "programId": 42,
  "mapId": 17,
  "timestamp": "2026-08-18T12:00:00+00:00"
}
```

### BPF Map Counter Collection

The map (`xdp_stats_map`) is a BPF array map with keys `0` (PASS) and `1` (DROP). Values hold `packets` and `bytes` counts. The collector parses `bpftool map dump` JSON output to extract these counters.

---

## XDP BPF Program (rakshasphere_xdp.bpf.c)

Source: `backend/src/main/resources/ebpf/rakshasphere_xdp.bpf.c`  
Compiled: `rakshasphere_xdp.bpf.o` (ELF BPF object, checked into repository)

This is a real BPF C program that:
- Attaches to the network interface via XDP
- Parses Ethernet → IPv4 headers
- Looks up source IP in `blocked_ips` BPF hash map
- Returns `XDP_DROP` if IP is blocked, `XDP_PASS` otherwise
- Increments counters in `xdp_stats_map`

---

## JNI eBPF Driver (EBpfDriver.java + eBpfDriver.c)

### Purpose
Provides a Java Native Interface bridge for the Spring Boot backend to call into native code when a remediation action (`eBPF_DROP`) is triggered.

### Behavior

```java
@PostConstruct
void init() {
    System.loadLibrary("ebpfdriver");  // Attempts to load libebpfdriver.so
    // On failure: sets nativeLoaded = false, prints warning
}

public native int injectDropRule(String ipAddress);
```

The C implementation (`eBpfDriver.c`) **simulates** XDP attachment:
```c
printf("[NATIVE eBPF] Attaching XDP drop rule for IP: %s to interface eth0...\n", ip_str);
printf("[NATIVE eBPF] libbpf: successfully loaded BPF object\n");
printf("[NATIVE eBPF] libbpf: successfully attached XDP program\n");
return 0;
```

> **Important:** This C code prints simulation messages but **does not make real BPF system calls**. It is a stub for demonstration. The actual kernel BPF state is managed by the `ebpf-collector` container independently.

### Failure Handling in SelfHealingService

```java
try {
    int result = eBpfDriver.injectDropRule(alert.getSourceIp());
} catch (UnsatisfiedLinkError e) {
    System.err.println("Native JNI library not loaded, skipping native driver execution.");
}
```

If `libebpfdriver.so` is not loaded, the remediation still succeeds at the database level — the alert status is updated and the audit log is written. Only the JNI call is skipped.

---

## Integration with Self-Healing

When an analyst triggers "Contain" (`eBPF_DROP`) action:

1. Frontend: `containAlert(alertId)` in `useAlertStore` → `POST /api/v1/self-healing/remediate`
2. Backend: `SelfHealingService.applyEbpfDrop()`:
   - Sets `alert.status = CONTAINED`
   - Sets `alert.remediationAction = "eBPF XDP Driver Kernel Drop Rule Injected for {IP}"`
   - Persists to DB
   - Attempts JNI `injectDropRule(sourceIp)` (may be no-op if `.so` not loaded)
   - Writes `AuditLog` with `action = INJECT_XDP_DROP`
3. Frontend: Optimistically updates alert status to `CONTAINED` in Zustand store

---

## eBPF Health Indicator (Spring Actuator)

`EBpfHealthIndicator.java` polls `http://localhost:7000/api/ebpf/status` with a 1-second timeout. The result is included in `GET /api/v1/system/health`.

| Collector Response `status` | Health Status |
|---------------------------|--------------|
| `HEALTHY` | `UP` |
| `DEGRADED` | `DEGRADED` |
| anything else / unreachable | `UNAVAILABLE` |

---

## Kernel Requirements

For the `ebpf-collector` container to fully function:
- Linux kernel ≥ 5.4 (for Generic XDP + bpftool)
- `/sys/fs/bpf` mounted (configured in `docker-compose.yml`)
- `/sys/kernel/btf/vmlinux` available (for BTF CO-RE support)
- `bpftool` installed in container
- Container must run `privileged: true`
