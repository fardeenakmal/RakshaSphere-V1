package com.rakshasphere.service;

import com.rakshasphere.dto.HoneypotEventDTO;
import com.rakshasphere.model.entity.HoneypotEvent;
import com.rakshasphere.model.entity.HoneypotSession;
import com.rakshasphere.repository.HoneypotEventRepository;
import com.rakshasphere.repository.HoneypotSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class HoneypotOrchestratorService {

    private static final Logger logger = LoggerFactory.getLogger(HoneypotOrchestratorService.class);

    @Autowired
    private HoneypotSessionRepository honeypotRepository;

    @Autowired
    private HoneypotEventRepository eventRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Value("${rakshasphere.honeypot.manager-url:http://localhost:6000}")
    private String managerUrl;

    @Value("${rakshasphere.honeypot.manager-api-key:changeme}")
    private String managerApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    // ──────────────────────────────────────────────────────────
    // GET all honeypot sessions
    // ──────────────────────────────────────────────────────────
    public List<HoneypotSession> getAllHoneypots() {
        return honeypotRepository.findAll();
    }

    // ──────────────────────────────────────────────────────────
    // GET honeypot session by ID
    // ──────────────────────────────────────────────────────────
    public Optional<HoneypotSession> getHoneypotById(String id) {
        return honeypotRepository.findById(id);
    }

    // ──────────────────────────────────────────────────────────
    // DELETE honeypot session — stops container if running and removes DB entry
    // ──────────────────────────────────────────────────────────
    @Transactional
    public void deleteHoneypot(String id) {
        honeypotRepository.findById(id).ifPresent(session -> {
            if ("RUNNING".equalsIgnoreCase(session.getStatus())) {
                stopHoneypot(id);
            }
            honeypotRepository.deleteById(id);
            logger.info("Deleted honeypot session record: {}", id);
        });
    }


    // ──────────────────────────────────────────────────────────
    // DEPLOY a new honeypot — calls Honeypot Manager API
    // ──────────────────────────────────────────────────────────
    @Transactional
    public HoneypotSession deployHoneypot(String service, String attackerIp) {
        int port = switch (service.toUpperCase()) {
            case "SSH" -> 2222;
            case "HTTP" -> 8080;
            case "TELNET" -> 2323;
            case "FTP" -> 2121;
            default -> 9000;
        };

        String sessionId = "HP-" + service.toUpperCase() + "-" + (int) (Math.random() * 90 + 10);
        String containerId = "pending";

        // Try to deploy via Honeypot Manager
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-API-Key", managerApiKey);

            Map<String, Object> body = new HashMap<>();
            body.put("session_id", sessionId);
            body.put("service", service.toUpperCase());
            body.put("attacker_ip", "0.0.0.0");
            body.put("host_port", port);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    managerUrl + "/api/deploy",
                    HttpMethod.POST,
                    request,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map responseBody = response.getBody();
                containerId = (String) responseBody.getOrDefault("container_id", "unknown");
                logger.info("Honeypot deployed via Manager: {} → container {}", sessionId, containerId);
            }
        } catch (Exception e) {
            logger.warn("Honeypot Manager unreachable, creating DB-only session: {}", e.getMessage());
            containerId = "simulation-" + Long.toHexString(System.currentTimeMillis()).substring(0, 8);
        }

        HoneypotSession newSession = HoneypotSession.builder()
                .id(sessionId)
                .service(service.toUpperCase())
                .containerId(containerId)
                .attackerIp(attackerIp)
                .port(port)
                .startTime(LocalDateTime.now())
                .status("RUNNING")
                .keystrokesJson("[]")
                .commandsJson("[]")
                .capturedPayloadsCount(0)
                .riskScore(60)
                .build();

        HoneypotSession saved = honeypotRepository.save(newSession);

        // Broadcast deployment event via STOMP
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("type", "HONEYPOT_DEPLOYED");
            event.put("sessionId", saved.getId());
            event.put("service", saved.getService());
            event.put("containerId", saved.getContainerId());
            event.put("port", saved.getPort());
            event.put("timestamp", LocalDateTime.now().toString());
            messagingTemplate.convertAndSend("/topic/honeypot-events", event);
        } catch (Exception e) {
            logger.warn("Failed to broadcast honeypot deployment event: {}", e.getMessage());
        }

        return saved;
    }

    // ──────────────────────────────────────────────────────────
    // STOP a honeypot — calls Honeypot Manager API
    // ──────────────────────────────────────────────────────────
    @Transactional
    public HoneypotSession stopHoneypot(String sessionId) {
        HoneypotSession session = honeypotRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Honeypot session not found: " + sessionId));

        // Try to stop via Honeypot Manager
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-API-Key", managerApiKey);

            HttpEntity<Void> request = new HttpEntity<>(headers);
            restTemplate.exchange(
                    managerUrl + "/api/stop/" + sessionId,
                    HttpMethod.POST,
                    request,
                    Map.class
            );
            logger.info("Honeypot stopped via Manager: {}", sessionId);
        } catch (Exception e) {
            logger.warn("Honeypot Manager stop call failed: {}", e.getMessage());
        }

        session.setStatus("TERMINATED");
        session.setEndTime(LocalDateTime.now());
        HoneypotSession saved = honeypotRepository.save(session);

        // Broadcast stop event via STOMP
        try {
            Map<String, Object> event = new HashMap<>();
            event.put("type", "HONEYPOT_STOPPED");
            event.put("sessionId", sessionId);
            event.put("timestamp", LocalDateTime.now().toString());
            messagingTemplate.convertAndSend("/topic/honeypot-events", event);
        } catch (Exception e) {
            logger.warn("Failed to broadcast honeypot stop event: {}", e.getMessage());
        }

        return saved;
    }

    // ──────────────────────────────────────────────────────────
    // PROCESS an event from Honeypot Manager
    // ──────────────────────────────────────────────────────────
    @Transactional
    public HoneypotEvent processEvent(HoneypotEventDTO dto) {
        // Parse timestamp
        LocalDateTime eventTime;
        try {
            eventTime = LocalDateTime.parse(dto.getTimestamp(), DateTimeFormatter.ISO_DATE_TIME);
        } catch (Exception e) {
            eventTime = LocalDateTime.now();
        }

        // Save event (password is intentionally excluded)
        final LocalDateTime finalEventTime = eventTime;

        HoneypotEvent event = HoneypotEvent.builder()
                .sessionId(dto.getSessionId())
                .eventType(dto.getEventType())
                .sourceIp(dto.getSourceIp())
                .sourcePort(dto.getSourcePort())
                .timestamp(finalEventTime)
                .username(dto.getUsername())
                .command(dto.getCommand())
                .rawEventJson(dto.getRawEventJson())
                .build();

        HoneypotEvent saved = eventRepository.save(event);

        // Update the parent session with new keystroke/command data
        honeypotRepository.findById(dto.getSessionId()).ifPresent(session -> {
            String eventType = dto.getEventType() != null ? dto.getEventType() : "";

            // Append to keystrokes
            if (eventType.contains("login") || eventType.contains("command") || eventType.contains("input")) {
                String entry = dto.getCommand() != null && !dto.getCommand().isEmpty()
                        ? dto.getCommand()
                        : eventType;
                appendToJsonArray(session, "keystrokes", entry);
            }

            // Append to commands
            if (eventType.contains("command")) {
                String cmd = dto.getCommand() != null ? dto.getCommand() : eventType;
                appendToJsonArray(session, "commands", cmd);
            }

            // Increment payload counter for file events
            if (eventType.contains("file_download") || eventType.contains("file_upload")) {
                session.setCapturedPayloadsCount(
                        (session.getCapturedPayloadsCount() != null ? session.getCapturedPayloadsCount() : 0) + 1
                );
            }

            // Increase risk score for dangerous events
            if (eventType.contains("login.success") || eventType.contains("file_download")) {
                int current = session.getRiskScore() != null ? session.getRiskScore() : 60;
                session.setRiskScore(Math.min(100, current + 5));
            }

            // Update session end on disconnect
            if (eventType.contains("session.closed")) {
                session.setEndTime(finalEventTime);
            }

            honeypotRepository.save(session);
        });

        // Broadcast event to STOMP subscribers
        try {
            Map<String, Object> stompPayload = new HashMap<>();
            stompPayload.put("type", "HONEYPOT_EVENT");
            stompPayload.put("sessionId", dto.getSessionId());
            stompPayload.put("eventType", dto.getEventType());
            stompPayload.put("sourceIp", dto.getSourceIp());
            stompPayload.put("command", dto.getCommand());
            stompPayload.put("username", dto.getUsername());
            stompPayload.put("timestamp", finalEventTime.toString());

            messagingTemplate.convertAndSend("/topic/honeypot-events", stompPayload);
        } catch (Exception e) {
            logger.warn("Failed to broadcast honeypot event via STOMP: {}", e.getMessage());
        }

        return saved;
    }

    // ──────────────────────────────────────────────────────────
    // GET events for a session
    // ──────────────────────────────────────────────────────────
    public List<HoneypotEvent> getEventsForSession(String sessionId) {
        return eventRepository.findBySessionIdOrderByTimestampAsc(sessionId);
    }

    // ──────────────────────────────────────────────────────────
    // Helper: append a string entry to a JSON array field
    // ──────────────────────────────────────────────────────────
    private void appendToJsonArray(HoneypotSession session, String field, String value) {
        try {
            String json = "keystrokes".equals(field)
                    ? session.getKeystrokesJson()
                    : session.getCommandsJson();

            if (json == null || json.isEmpty()) {
                json = "[]";
            }

            // Simple JSON array append (avoid pulling in Jackson for this)
            if (json.equals("[]")) {
                json = "[\"" + escapeJson(value) + "\"]";
            } else {
                json = json.substring(0, json.length() - 1) + ",\"" + escapeJson(value) + "\"]";
            }

            // Cap array size at 200 entries to prevent unbounded growth
            long commaCount = json.chars().filter(c -> c == ',').count();
            if (commaCount > 200) {
                int firstComma = json.indexOf(',');
                json = "[" + json.substring(firstComma + 1);
            }

            if ("keystrokes".equals(field)) {
                session.setKeystrokesJson(json);
            } else {
                session.setCommandsJson(json);
            }
        } catch (Exception e) {
            logger.warn("Error appending to JSON array: {}", e.getMessage());
        }
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
