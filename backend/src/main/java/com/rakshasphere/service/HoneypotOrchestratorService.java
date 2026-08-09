package com.rakshasphere.service;

import com.rakshasphere.model.entity.HoneypotSession;
import com.rakshasphere.repository.HoneypotSessionRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class HoneypotOrchestratorService {

    @Autowired
    private HoneypotSessionRepository honeypotRepository;

    @PostConstruct
    public void seedHoneypots() {
        if (honeypotRepository.count() == 0) {
            honeypotRepository.saveAll(List.of(
                    HoneypotSession.builder()
                            .id("HP-SSH-01")
                            .service("SSH")
                            .containerId("docker-trap-ssh-7f9a")
                            .attackerIp("185.220.101.5")
                            .port(2222)
                            .startTime(LocalDateTime.now().minusHours(1))
                            .status("RUNNING")
                            .keystrokesJson("[\"ssh root@192.168.10.45\", \"uname -a\", \"cat /etc/passwd\"]")
                            .commandsJson("[\"uname -a\", \"cat /etc/passwd\"]")
                            .capturedPayloadsCount(3)
                            .riskScore(88)
                            .build(),
                    HoneypotSession.builder()
                            .id("HP-HTTP-02")
                            .service("HTTP")
                            .containerId("docker-trap-web-3c1b")
                            .attackerIp("198.51.100.42")
                            .port(8080)
                            .startTime(LocalDateTime.now().minusMinutes(30))
                            .status("RUNNING")
                            .keystrokesJson("[\"GET /admin/login.php?user=admin' OR 1=1--\"]")
                            .commandsJson("[\"SQL injection probe\"]")
                            .capturedPayloadsCount(5)
                            .riskScore(92)
                            .build()
            ));
        }
    }

    public List<HoneypotSession> getAllHoneypots() {
        return honeypotRepository.findAll();
    }

    public HoneypotSession deployHoneypot(String service, String attackerIp) {
        int port = switch (service.toUpperCase()) {
            case "SSH" -> 2222;
            case "HTTP" -> 8080;
            case "TELNET" -> 2323;
            case "FTP" -> 2121;
            default -> 9000;
        };

        HoneypotSession newSession = HoneypotSession.builder()
                .id("HP-" + service.toUpperCase() + "-" + (int)(Math.random() * 90 + 10))
                .service(service.toUpperCase())
                .containerId("docker-trap-" + service.toLowerCase() + "-" + Long.toHexString(System.currentTimeMillis()).substring(0, 6))
                .attackerIp(attackerIp)
                .port(port)
                .startTime(LocalDateTime.now())
                .status("RUNNING")
                .keystrokesJson("[\"Container trap initialized\"]")
                .commandsJson("[\"Initialization\"]")
                .capturedPayloadsCount(0)
                .riskScore(60)
                .build();

        return honeypotRepository.save(newSession);
    }
}
