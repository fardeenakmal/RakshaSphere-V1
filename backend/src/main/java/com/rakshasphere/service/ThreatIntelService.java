package com.rakshasphere.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Service
public class ThreatIntelService {

    private static final Logger log = LoggerFactory.getLogger(ThreatIntelService.class);

    private final WebClient webClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${threat-intel.virustotal.api-key:}")
    private String virusTotalApiKey;

    @Value("${threat-intel.abuseipdb.api-key:}")
    private String abuseIpDbApiKey;

    public ThreatIntelService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    public Mono<Map<String, String>> enrichIpData(String ipAddress) {
        if (isInternalIp(ipAddress)) {
            return Mono.just(getInternalIpData(ipAddress));
        }

        Mono<Map<String, String>> vtMono = fetchVirusTotalData(ipAddress);
        Mono<Map<String, String>> abuseMono = fetchAbuseIpDbData(ipAddress);

        return Mono.zip(vtMono, abuseMono)
                .map(tuple -> {
                    Map<String, String> intel = new HashMap<>();
                    Map<String, String> vt = tuple.getT1();
                    Map<String, String> abuse = tuple.getT2();

                    intel.put("virusTotalScore", vt.getOrDefault("virusTotalScore", "UNAVAILABLE"));
                    intel.put("abuseIpDbConfidence", abuse.getOrDefault("abuseIpDbConfidence", "0"));

                    String country = vt.get("geoCountry");
                    if (country == null || country.isBlank() || country.equals("Unknown")) {
                        country = abuse.getOrDefault("geoCountry", "External Analysis");
                    }
                    intel.put("geoCountry", country);

                    String isp = vt.get("ispName");
                    if (isp == null || isp.isBlank() || isp.equals("Unknown ISP")) {
                        isp = abuse.getOrDefault("ispName", "Public Network");
                    }
                    intel.put("ispName", isp);

                    return intel;
                })
                .onErrorResume(e -> {
                    log.warn("Threat intelligence API request failed for IP {}: {}", ipAddress, e.getMessage());
                    return Mono.just(getFallbackData(ipAddress));
                });
    }

    public Mono<Map<String, String>> fetchVirusTotalData(String ipAddress) {
        if (virusTotalApiKey == null || virusTotalApiKey.isBlank()) {
            Map<String, String> res = new HashMap<>();
            res.put("virusTotalScore", "NOT_CONFIGURED");
            return Mono.just(res);
        }

        return webClient.get()
                .uri("https://www.virustotal.com/api/v3/ip_addresses/" + ipAddress)
                .header("x-apikey", virusTotalApiKey)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(4))
                .retryWhen(Retry.backoff(2, Duration.ofMillis(500)).filter(t -> !(t instanceof WebClientResponseException.Unauthorized)))
                .map(this::parseVirusTotalResponse)
                .onErrorResume(WebClientResponseException.Unauthorized.class, e -> Mono.just(createVtErrorMap("UNAUTHORIZED")))
                .onErrorResume(WebClientResponseException.Forbidden.class, e -> Mono.just(createVtErrorMap("FORBIDDEN")))
                .onErrorResume(WebClientResponseException.TooManyRequests.class, e -> Mono.just(createVtErrorMap("RATE_LIMITED")))
                .onErrorResume(e -> Mono.just(createVtErrorMap("UNAVAILABLE")));
    }

    public Mono<Map<String, String>> fetchAbuseIpDbData(String ipAddress) {
        if (abuseIpDbApiKey == null || abuseIpDbApiKey.isBlank()) {
            Map<String, String> res = new HashMap<>();
            res.put("abuseIpDbConfidence", "NOT_CONFIGURED");
            return Mono.just(res);
        }

        return webClient.get()
                .uri("https://api.abuseipdb.com/api/v2/check?ipAddress=" + ipAddress)
                .header("Key", abuseIpDbApiKey)
                .header("Accept", "application/json")
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(4))
                .retryWhen(Retry.backoff(2, Duration.ofMillis(500)).filter(t -> !(t instanceof WebClientResponseException.Unauthorized)))
                .map(this::parseAbuseIpDbResponse)
                .onErrorResume(WebClientResponseException.Unauthorized.class, e -> Mono.just(createAbuseErrorMap("UNAUTHORIZED")))
                .onErrorResume(WebClientResponseException.Forbidden.class, e -> Mono.just(createAbuseErrorMap("FORBIDDEN")))
                .onErrorResume(WebClientResponseException.TooManyRequests.class, e -> Mono.just(createAbuseErrorMap("RATE_LIMITED")))
                .onErrorResume(e -> Mono.just(createAbuseErrorMap("UNAVAILABLE")));
    }

    private Map<String, String> parseVirusTotalResponse(String jsonResponse) {
        Map<String, String> vtData = new HashMap<>();
        try {
            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode attributes = root.path("data").path("attributes");
            JsonNode stats = attributes.path("last_analysis_stats");

            int malicious = stats.path("malicious").asInt(0);
            int harmless = stats.path("harmless").asInt(0);
            int suspicious = stats.path("suspicious").asInt(0);
            int undetected = stats.path("undetected").asInt(0);
            int total = malicious + harmless + suspicious + undetected;

            String score = malicious + "/" + (total > 0 ? total : 90) + (malicious > 0 ? " Malicious" : " Clean");
            vtData.put("virusTotalScore", score);

            if (attributes.hasNonNull("country")) {
                vtData.put("geoCountry", attributes.get("country").asText("External Analysis"));
            }
            if (attributes.hasNonNull("as_owner")) {
                vtData.put("ispName", attributes.get("as_owner").asText("Public Network"));
            }
        } catch (Exception e) {
            log.error("Failed to parse VirusTotal JSON response", e);
            vtData.put("virusTotalScore", "UNAVAILABLE");
        }
        return vtData;
    }

    private Map<String, String> parseAbuseIpDbResponse(String jsonResponse) {
        Map<String, String> abuseData = new HashMap<>();
        try {
            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode data = root.path("data");

            int score = data.path("abuseConfidenceScore").asInt(0);
            abuseData.put("abuseIpDbConfidence", String.valueOf(score));

            if (data.hasNonNull("countryCode")) {
                abuseData.put("geoCountry", data.get("countryCode").asText());
            }
            if (data.hasNonNull("isp")) {
                abuseData.put("ispName", data.get("isp").asText());
            }
        } catch (Exception e) {
            log.error("Failed to parse AbuseIPDB JSON response", e);
            abuseData.put("abuseIpDbConfidence", "UNAVAILABLE");
        }
        return abuseData;
    }

    private Map<String, String> createVtErrorMap(String status) {
        Map<String, String> map = new HashMap<>();
        map.put("virusTotalScore", status);
        return map;
    }

    private Map<String, String> createAbuseErrorMap(String score) {
        Map<String, String> map = new HashMap<>();
        map.put("abuseIpDbConfidence", score);
        return map;
    }

    private boolean isInternalIp(String ip) {
        return ip == null || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.16.") || ip.equals("127.0.0.1") || ip.equals("0:0:0:0:0:0:0:1");
    }

    private Map<String, String> getInternalIpData(String ip) {
        Map<String, String> intel = new HashMap<>();
        intel.put("virusTotalScore", "INTERNAL_IP");
        intel.put("abuseIpDbConfidence", "N/A");
        intel.put("geoCountry", "Internal Network");
        intel.put("ispName", "Local Infrastructure (RFC 1918)");
        return intel;
    }

    private Map<String, String> getFallbackData(String ip) {
        Map<String, String> intel = new HashMap<>();
        intel.put("virusTotalScore", "UNAVAILABLE");
        intel.put("abuseIpDbConfidence", "UNAVAILABLE");
        intel.put("geoCountry", "Unknown");
        intel.put("ispName", "Unknown ISP");
        return intel;
    }
}


