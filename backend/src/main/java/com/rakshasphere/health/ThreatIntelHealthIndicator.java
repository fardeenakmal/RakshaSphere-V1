package com.rakshasphere.health;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.net.HttpURLConnection;
import java.net.URI;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component("threatIntel")
public class ThreatIntelHealthIndicator implements HealthIndicator {

    private static final Logger log = LoggerFactory.getLogger(ThreatIntelHealthIndicator.class);
    private static final long CACHE_TTL_MS = 180000; // 3 minutes cache for external threat intel APIs

    @Value("${threat-intel.virustotal.api-key:}")
    private String virusTotalApiKey;

    @Value("${threat-intel.abuseipdb.api-key:}")
    private String abuseIpDbApiKey;

    private final Map<String, CacheEntry> cache = new ConcurrentHashMap<>();

    private static class CacheEntry {
        final Map<String, Object> data;
        final long timestamp;

        CacheEntry(Map<String, Object> data, long timestamp) {
            this.data = data;
            this.timestamp = timestamp;
        }
    }

    @Override
    public Health health() {
        Map<String, Object> vtDetails = getVirusTotalHealth();
        Map<String, Object> abuseDetails = getAbuseIpDbHealth();

        boolean vtOk = "HEALTHY".equals(vtDetails.get("status"));
        boolean abuseOk = "HEALTHY".equals(abuseDetails.get("status"));

        boolean vtConfigured = !"NOT_CONFIGURED".equals(vtDetails.get("status"));
        boolean abuseConfigured = !"NOT_CONFIGURED".equals(abuseDetails.get("status"));

        org.springframework.boot.actuate.health.Status overall;
        if (vtOk && abuseOk) {
            overall = CustomHealthStatuses.HEALTHY;
        } else if (!vtConfigured && !abuseConfigured) {
            overall = CustomHealthStatuses.DEGRADED;
        } else if (vtOk || abuseOk) {
            overall = CustomHealthStatuses.DEGRADED;
        } else {
            overall = CustomHealthStatuses.DOWN;
        }

        return Health.status(overall)
                .withDetail("virusTotal", vtDetails)
                .withDetail("abuseIpDb", abuseDetails)
                .build();
    }

    private Map<String, Object> getVirusTotalHealth() {
        long now = System.currentTimeMillis();
        CacheEntry entry = cache.get("virustotal");
        if (entry != null && (now - entry.timestamp) < CACHE_TTL_MS) {
            Map<String, Object> cachedData = new HashMap<>(entry.data);
            cachedData.put("cached", true);
            cachedData.put("cacheAgeSec", (now - entry.timestamp) / 1000);
            return cachedData;
        }

        Map<String, Object> details = checkVirusTotal();
        cache.put("virustotal", new CacheEntry(details, now));
        return details;
    }

    private Map<String, Object> getAbuseIpDbHealth() {
        long now = System.currentTimeMillis();
        CacheEntry entry = cache.get("abuseipdb");
        if (entry != null && (now - entry.timestamp) < CACHE_TTL_MS) {
            Map<String, Object> cachedData = new HashMap<>(entry.data);
            cachedData.put("cached", true);
            cachedData.put("cacheAgeSec", (now - entry.timestamp) / 1000);
            return cachedData;
        }

        Map<String, Object> details = checkAbuseIpDb();
        cache.put("abuseipdb", new CacheEntry(details, now));
        return details;
    }

    private Map<String, Object> checkVirusTotal() {
        Map<String, Object> details = new HashMap<>();
        details.put("lastChecked", Instant.now().toString());

        if (virusTotalApiKey == null || virusTotalApiKey.isBlank()) {
            details.put("status", "NOT_CONFIGURED");
            details.put("configured", false);
            details.put("message", "API key missing in environment");
            return details;
        }

        details.put("configured", true);
        long start = System.currentTimeMillis();
        try {
            HttpURLConnection connection = (HttpURLConnection) new URI("https://www.virustotal.com/api/v3/ip_addresses/8.8.8.8").toURL().openConnection();
            connection.setRequestMethod("GET");
            connection.setRequestProperty("x-apikey", virusTotalApiKey);
            connection.setConnectTimeout(800);
            connection.setReadTimeout(800);

            int code = connection.getResponseCode();
            long latencyMs = System.currentTimeMillis() - start;
            details.put("latencyMs", latencyMs);

            if (code == 200) {
                details.put("status", "HEALTHY");
                details.put("lastSuccessfulCheck", Instant.now().toString());
            } else if (code == 429) {
                details.put("status", "RATE_LIMITED");
                details.put("httpCode", code);
            } else if (code == 401 || code == 403) {
                details.put("status", "INVALID_CREDENTIAL");
                details.put("httpCode", code);
            } else {
                details.put("status", "DEGRADED");
                details.put("httpCode", code);
            }
        } catch (Exception e) {
            long latencyMs = System.currentTimeMillis() - start;
            details.put("status", "DEGRADED");
            details.put("latencyMs", latencyMs);
            details.put("error", "External API unreachable or timed out");
        }
        return details;
    }

    private Map<String, Object> checkAbuseIpDb() {
        Map<String, Object> details = new HashMap<>();
        details.put("lastChecked", Instant.now().toString());

        if (abuseIpDbApiKey == null || abuseIpDbApiKey.isBlank()) {
            details.put("status", "NOT_CONFIGURED");
            details.put("configured", false);
            details.put("message", "API key missing in environment");
            return details;
        }

        details.put("configured", true);
        long start = System.currentTimeMillis();
        try {
            HttpURLConnection connection = (HttpURLConnection) new URI("https://api.abuseipdb.com/api/v2/check?ipAddress=127.0.0.1").toURL().openConnection();
            connection.setRequestMethod("GET");
            connection.setRequestProperty("Key", abuseIpDbApiKey);
            connection.setRequestProperty("Accept", "application/json");
            connection.setConnectTimeout(800);
            connection.setReadTimeout(800);

            int code = connection.getResponseCode();
            long latencyMs = System.currentTimeMillis() - start;
            details.put("latencyMs", latencyMs);

            if (code == 200) {
                details.put("status", "HEALTHY");
                details.put("lastSuccessfulCheck", Instant.now().toString());
            } else if (code == 429) {
                details.put("status", "RATE_LIMITED");
                details.put("httpCode", code);
            } else if (code == 401 || code == 403) {
                details.put("status", "INVALID_CREDENTIAL");
                details.put("httpCode", code);
            } else {
                details.put("status", "DEGRADED");
                details.put("httpCode", code);
            }
        } catch (Exception e) {
            long latencyMs = System.currentTimeMillis() - start;
            details.put("status", "DEGRADED");
            details.put("latencyMs", latencyMs);
            details.put("error", "External API unreachable or timed out");
        }
        return details;
    }
}
