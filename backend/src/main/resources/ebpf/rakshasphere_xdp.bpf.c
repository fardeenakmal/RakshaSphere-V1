// SPDX-License-Identifier: GPL-2.0 OR BSD-2-Clause
/* RakshaSphere eBPF XDP Real-Time Network Telemetry Probe
 *
 * Observation-only kernel telemetry probe.
 * Monitors ingress network packets on the attached interface,
 * records packet and byte counters in a kernel BPF ARRAY map,
 * and safely forwards all traffic by returning XDP_PASS.
 */

#include <linux/bpf.h>
#include <linux/if_ether.h>
#include <linux/ip.h>
#include <linux/in.h>
#include <bpf/bpf_helpers.h>

/* Map Index Keys */
#define STATS_PKTS_TOTAL 0
#define STATS_BYTES_TOTAL 1
#define STATS_PKTS_PASS   2
#define STATS_PKTS_DROP   3

/* BPF Map: 64-bit Statistics Array */
struct {
    __uint(type, BPF_MAP_TYPE_ARRAY);
    __uint(max_entries, 4);
    __type(key, __u32);
    __type(value, __u64);
} xdp_stats_map SEC(".maps");

SEC("xdp")
int rakshasphere_xdp_telemetry(struct xdp_md *ctx) {
    void *data_end = (void *)(long)ctx->data_end;
    void *data = (void *)(long)ctx->data;
    __u64 pkt_len = (__u64)(data_end - data);

    /* Index keys */
    __u32 key_pkts = STATS_PKTS_TOTAL;
    __u32 key_bytes = STATS_BYTES_TOTAL;
    __u32 key_pass = STATS_PKTS_PASS;

    /* Update Total Packets Counter */
    __u64 *pkts = bpf_map_lookup_elem(&xdp_stats_map, &key_pkts);
    if (pkts) {
        __sync_fetch_and_add(pkts, 1);
    }

    /* Update Total Bytes Counter */
    __u64 *bytes = bpf_map_lookup_elem(&xdp_stats_map, &key_bytes);
    if (bytes) {
        __sync_fetch_and_add(bytes, pkt_len);
    }

    /* Update Pass Counter */
    __u64 *pass = bpf_map_lookup_elem(&xdp_stats_map, &key_pass);
    if (pass) {
        __sync_fetch_and_add(pass, 1);
    }

    /* Safe forwarding of all traffic — observation only */
    return XDP_PASS;
}

char _license[] SEC("license") = "GPL";
