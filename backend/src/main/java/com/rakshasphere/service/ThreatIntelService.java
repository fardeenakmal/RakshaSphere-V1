package com.rakshasphere.service;

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

        Mono<String> vtMono = fetchVirusTotalData(ipAddress);
        Mono<String> abuseMono = fetchAbuseIpDbData(ipAddress);

        return Mono.zip(vtMono, abuseMono)
                .map(tuple -> {
                    Map<String, String> intel = new HashMap<>();
                    intel.put("virusTotalScore", tuple.getT1());
                    intel.put("abuseIpDbConfidence", tuple.getT2());
                    intel.put("geoCountry", "External Analysis");
                    intel.put("ispName", "Public Network");
                    return intel;
                })
                .onErrorResume(e -> {
                    log.warn("Threat intelligence API request failed for IP {}: {}", ipAddress, e.getMessage());
                    return Mono.just(getFallbackData(ipAddress));
                });
    }

    private Mono<String> fetchVirusTotalData(String ipAddress) {
        if (virusTotalApiKey == null || virusTotalApiKey.isBlank()) {
            return Mono.just("NOT_CONFIGURED");
        }

        return webClient.get()
                .uri("https://www.virustotal.com/api/v3/ip_addresses/" + ipAddress)
                .header("x-apikey", virusTotalApiKey)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(3))
                .retryWhen(Retry.backoff(2, Duration.ofMillis(500)).filter(t -> !(t instanceof WebClientResponseException.Unauthorized)))
                .map(response -> "ANALYZE_COMPLETE")
                .onErrorResume(WebClientResponseException.Unauthorized.class, e -> Mono.just("UNAUTHORIZED_401"))
                .onErrorResume(WebClientResponseException.Forbidden.class, e -> Mono.just("FORBIDDEN_403"))
                .onErrorResume(WebClientResponseException.TooManyRequests.class, e -> Mono.just("RATE_LIMITED_429"))
                .onErrorResume(e -> Mono.just("UNREACHABLE"));
    }

    private Mono<String> fetchAbuseIpDbData(String ipAddress) {
        if (abuseIpDbApiKey == null || abuseIpDbApiKey.isBlank()) {
            return Mono.just("NOT_CONFIGURED");
        }

        return webClient.get()
                .uri("https://api.abuseipdb.com/api/v2/check?ipAddress=" + ipAddress)
                .header("Key", abuseIpDbApiKey)
                .header("Accept", "application/json")
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(3))
                .retryWhen(Retry.backoff(2, Duration.ofMillis(500)).filter(t -> !(t instanceof WebClientResponseException.Unauthorized)))
                .map(response -> "CHECK_COMPLETE")
                .onErrorResume(WebClientResponseException.Unauthorized.class, e -> Mono.just("UNAUTHORIZED_401"))
                .onErrorResume(WebClientResponseException.Forbidden.class, e -> Mono.just("FORBIDDEN_403"))
                .onErrorResume(WebClientResponseException.TooManyRequests.class, e -> Mono.just("RATE_LIMITED_429"))
                .onErrorResume(e -> Mono.just("UNREACHABLE"));
    }

    private boolean isInternalIp(String ip) {
        return ip == null || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("172.16.") || ip.equals("127.0.0.1") || ip.equals("0:0:0:0:0:0:0:1");
    }

    private Map<String, String> getInternalIpData(String ip) {
        Map<String, String> intel = new HashMap<>();
        intel.put("virusTotalScore", "0/90 Clean");
        intel.put("abuseIpDbConfidence", "0");
        intel.put("geoCountry", "Internal Network");
        intel.put("ispName", "Local Infrastructure");
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

