package com.rakshasphere.service;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.util.HashMap;
import java.util.Map;

@Service
public class ThreatIntelService {

    private final WebClient webClient;

    public ThreatIntelService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.build();
    }

    public Mono<Map<String, String>> enrichIpData(String ipAddress) {
        // In a real environment, we'd call VirusTotal and AbuseIPDB APIs.
        // For demonstration, we attempt a mock request or return default mock data.
        return Mono.just(getMockData(ipAddress));
        
        /* 
        // Example actual implementation
        return webClient.get()
                .uri("https://www.virustotal.com/api/v3/ip_addresses/" + ipAddress)
                .header("x-apikey", "YOUR_API_KEY")
                .retrieve()
                .bodyToMono(String.class)
                .map(response -> {
                    // Parse response
                    Map<String, String> intel = new HashMap<>();
                    intel.put("virusTotalScore", "15/90 Malicious");
                    return intel;
                })
                .onErrorResume(WebClientResponseException.class, e -> {
                    return Mono.just(getMockData(ipAddress));
                });
        */
    }

    private Map<String, String> getMockData(String ip) {
        Map<String, String> intel = new HashMap<>();
        
        if (ip.startsWith("192.") || ip.startsWith("10.") || ip.startsWith("172.")) {
            intel.put("virusTotalScore", "0/90 Clean");
            intel.put("abuseIpDbConfidence", "0");
            intel.put("geoCountry", "Internal Network");
            intel.put("ispName", "Local");
        } else {
            // Randomize slightly for demo
            int score = (int) (Math.random() * 30) + 5;
            intel.put("virusTotalScore", score + "/90 Malicious");
            intel.put("abuseIpDbConfidence", String.valueOf((int) (Math.random() * 50) + 50));
            intel.put("geoCountry", Math.random() > 0.5 ? "RU (Russian Federation)" : "CN (China)");
            intel.put("ispName", "Suspicious Hosting Inc");
        }
        
        return intel;
    }
}
