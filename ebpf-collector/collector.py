"""
RakshaSphere eBPF XDP Real-Time Telemetry Collector Daemon (:7000)
Monitors the Linux kernel BPF subsystem, manages XDP probe attachment to the test interface,
and reads real kernel BPF map counters (packet count, byte count, pass/drop metrics).
"""

import json
import os
import subprocess
import time
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="RakshaSphere eBPF XDP Telemetry Collector",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

IFACE = os.getenv("EBPF_INTERFACE", "veth_raksha0")
PEER_IFACE = os.getenv("EBPF_PEER_INTERFACE", "veth_raksha1")
BPF_PROG_PATH = os.getenv("BPF_PROG_PATH", "/app/rakshasphere_xdp.bpf.o")
PINNED_PROG = "/sys/fs/bpf/raksha_xdp_prog"
PINNED_MAP = "/sys/fs/bpf/xdp_stats_map"


def run_cmd(cmd: list[str]) -> tuple[int, str]:
    try:
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5)
        return res.returncode, res.stdout.strip()
    except Exception as e:
        return 1, str(e)


def init_veth_pair():
    """Ensure dedicated safe test veth interfaces exist with non-routable test subnet."""
    run_cmd(["ip", "link", "add", "dev", IFACE, "type", "veth", "peer", "name", PEER_IFACE])
    run_cmd(["ip", "addr", "add", "10.99.0.1/24", "dev", IFACE])
    run_cmd(["ip", "addr", "add", "10.99.0.2/24", "dev", PEER_IFACE])
    run_cmd(["ip", "link", "set", "dev", IFACE, "up"])
    run_cmd(["ip", "link", "set", "dev", PEER_IFACE, "up"])


def ensure_loaded_and_attached():
    """Load eBPF program into kernel and attach generic XDP to test interface if not already attached."""
    init_veth_pair()

    # Check if pinned prog exists
    if not os.path.exists(PINNED_PROG):
        if os.path.exists(BPF_PROG_PATH):
            run_cmd(["bpftool", "prog", "load", BPF_PROG_PATH, PINNED_PROG, "type", "xdp", "pinmaps", "/sys/fs/bpf"])

    # Check if attached
    ret, out = run_cmd(["bpftool", "net", "show", "dev", IFACE])
    if "xdp" not in out or "generic" not in out:
        run_cmd(["bpftool", "net", "attach", "xdpgeneric", "pinned", PINNED_PROG, "dev", IFACE])


@app.on_event("startup")
def startup():
    ensure_loaded_and_attached()


@app.get("/health")
@app.get("/api/ebpf/status")
def get_ebpf_status():
    """Reads real Linux kernel BPF state and map counters."""
    # Check if interface exists
    ret, iface_out = run_cmd(["ip", "link", "show", IFACE])
    if ret != 0:
        return {
            "status": "UNAVAILABLE",
            "attached": False,
            "xdpMode": "NOT_ATTACHED",
            "interface": IFACE,
            "reason": f"Interface {IFACE} not found",
            "packetsTotal": 0,
            "bytesTotal": 0,
            "passPackets": 0,
            "dropPackets": 0
        }

    # Check XDP attachment status
    ret, net_out = run_cmd(["bpftool", "net", "show", "dev", IFACE])
    is_attached = False
    xdp_mode = "NOT_ATTACHED"
    prog_id = None

    if ret == 0 and "generic" in net_out:
        is_attached = True
        xdp_mode = "GENERIC"
        # Extract program ID if present
        for part in net_out.split():
            if part.isdigit():
                prog_id = int(part)
    elif ret == 0 and "native" in net_out:
        is_attached = True
        xdp_mode = "NATIVE"

    # Read BPF map counters from kernel
    pkts_total = 0
    bytes_total = 0
    pkts_pass = 0
    pkts_drop = 0
    map_readable = False

    if os.path.exists(PINNED_MAP):
        ret, map_out = run_cmd(["bpftool", "map", "dump", "pinned", PINNED_MAP, "-j"])
        if ret == 0:
            try:
                entries = json.loads(map_out)
                map_readable = True
                for entry in entries:
                    fmt = entry.get("formatted", entry)
                    key = fmt.get("key")
                    val = fmt.get("value", 0)
                    if key == 0:
                        pkts_total = val
                    elif key == 1:
                        bytes_total = val
                    elif key == 2:
                        pkts_pass = val
                    elif key == 3:
                        pkts_drop = val
            except Exception:
                pass

    status = "HEALTHY" if (is_attached and xdp_mode == "NATIVE") else ("DEGRADED" if is_attached else "UNAVAILABLE")
    reason = "XDP native mode unavailable on veth; generic XDP kernel hook attached." if xdp_mode == "GENERIC" else (
        "eBPF XDP probe attached and active" if is_attached else "XDP probe not attached to interface"
    )

    return {
        "status": status,
        "attached": is_attached,
        "xdpMode": xdp_mode,
        "interface": IFACE,
        "programId": prog_id,
        "programName": "rakshasphere_xdp_telemetry",
        "bpfMapPinned": os.path.exists(PINNED_MAP),
        "bpfMapReadable": map_readable,
        "packetsTotal": pkts_total,
        "bytesTotal": bytes_total,
        "passPackets": pkts_pass,
        "dropPackets": pkts_drop,
        "reason": reason,
        "kernelBtf": os.path.exists("/sys/kernel/btf/vmlinux"),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.post("/api/ebpf/attach")
def attach_xdp():
    """Attaches XDP program to the test interface."""
    ensure_loaded_and_attached()
    return get_ebpf_status()


@app.post("/api/ebpf/detach")
def detach_xdp():
    """Detaches XDP program from interface for failure testing."""
    run_cmd(["bpftool", "net", "detach", "xdpgeneric", "dev", IFACE])
    return get_ebpf_status()


@app.post("/api/ebpf/generate-traffic")
def generate_traffic(count: int = 5):
    """Transmits real ICMP network packets across the veth interface to exercise the XDP probe."""
    run_cmd(["ping", "-c", str(count), "10.99.0.1", "-I", PEER_IFACE])
    return get_ebpf_status()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7000)
