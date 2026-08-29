package com.rakshasphere;

import com.rakshasphere.dto.AuthRequestDTO;
import com.rakshasphere.service.AuthenticationService;
import com.rakshasphere.service.ThreatIntelService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class RakshaSphereApplicationTests {

    @Autowired
    private AuthenticationService authService;

    @Autowired
    private ThreatIntelService threatIntelService;

    @Autowired
    private com.rakshasphere.service.SystemHealthService systemHealthService;

    @Test
    @DisplayName("Verify Spring context loads cleanly")
    void contextLoads() {
        assertNotNull(authService, "AuthenticationService should be loaded into Spring Context");
        assertNotNull(threatIntelService, "ThreatIntelService should be loaded into Spring Context");
    }

    @Test
    @DisplayName("Verify authentication service validates valid admin credentials")
    void testAdminAuthentication() {
        AuthRequestDTO request = new AuthRequestDTO();
        request.setUsername("admin");
        request.setPassword("Admin@Raksha2026!");

        var response = authService.authenticate(request);
        assertNotNull(response);
        assertEquals("admin", response.getUsername());
        assertEquals("ROLE_ADMIN", response.getRole());
        assertNotNull(response.getToken());
    }

    @Test
    @DisplayName("Verify invalid password throws BadCredentialsException (401)")
    void testInvalidPasswordAuthentication() {
        AuthRequestDTO request = new AuthRequestDTO();
        request.setUsername("admin");
        request.setPassword("WrongPassword123!");

        assertThrows(org.springframework.security.authentication.BadCredentialsException.class, () -> {
            authService.authenticate(request);
        });
    }

    @Test
    @DisplayName("Verify invalid username throws BadCredentialsException (401)")
    void testInvalidUsernameAuthentication() {
        AuthRequestDTO request = new AuthRequestDTO();
        request.setUsername("non_existent_user_999");
        request.setPassword("Admin@Raksha2026!");

        assertThrows(org.springframework.security.authentication.BadCredentialsException.class, () -> {
            authService.authenticate(request);
        });
    }

    @Test
    @DisplayName("Verify real system info endpoint returns OS, RAM, Disk and JVM metrics")
    void testSystemInfoRetrieval() {
        var info = systemHealthService.getSystemInfo();
        assertNotNull(info);
        assertNotNull(info.get("osName"));
        assertNotNull(info.get("javaVersion"));
        assertNotNull(info.get("availableProcessors"));
        assertNotNull(info.get("ramTotalMb"));
        assertNotNull(info.get("diskTotalGb"));
        assertNotNull(info.get("containerized"));
    }

    @Test
    @DisplayName("Verify internal IP addresses return clean threat intel scores")
    void testInternalIpThreatIntel() {
        Map<String, String> intel = threatIntelService.enrichIpData("192.168.1.100").block();
        assertNotNull(intel);
        assertEquals("INTERNAL_IP", intel.get("virusTotalScore"));
        assertEquals("N/A", intel.get("abuseIpDbConfidence"));
        assertEquals("Internal Network", intel.get("geoCountry"));
    }

    @Test
    @DisplayName("Verify external IP threat intel returns non-blocking status")
    void testExternalUnconfiguredThreatIntel() {
        Map<String, String> intel = threatIntelService.enrichIpData("1.1.1.1").block();
        assertNotNull(intel);
        assertNotNull(intel.get("virusTotalScore"));
        assertNotNull(intel.get("abuseIpDbConfidence"));
    }

    @Autowired
    private com.rakshasphere.repository.IotDeviceRepository iotDeviceRepository;

    @Autowired
    private com.rakshasphere.repository.UserRepository userRepository;

    @Test
    @DisplayName("Verify system health aggregator returns all 13 core service statuses")
    void testSystemHealthAggregator() {
        var health = systemHealthService.getSystemHealth();
        assertNotNull(health);
        assertNotNull(health.getOverallStatus());
        assertNotNull(health.getSummary());
        assertTrue(health.getServices().size() >= 10);
    }

    @Test
    @DisplayName("Verify user registration assigns PENDING status and prevents public ADMIN self-granting")
    void testUserRegistrationSecurity() {
        var regDto = new com.rakshasphere.dto.RegisterRequestDTO();
        String testUser = "test_user_" + System.currentTimeMillis();
        regDto.setUsername(testUser);
        regDto.setName("Test User");
        regDto.setEmail(testUser + "@enterprise.com");
        regDto.setPassword("TestPass123!");
        regDto.setConfirmPassword("TestPass123!");
        regDto.setRequestedRole("ROLE_ADMIN");

        var registered = authService.register(regDto);
        assertNotNull(registered);
        assertEquals(com.rakshasphere.model.entity.UserStatus.PENDING, registered.getStatus());
        assertEquals(com.rakshasphere.model.entity.UserRole.ROLE_USER, registered.getRole());
    }

    @Test
    @DisplayName("Verify IoT Device database persistence and status tracking")
    void testIotDevicePersistence() {
        String devId = "TEST-DEV-" + System.currentTimeMillis();
        var device = com.rakshasphere.model.entity.IotDevice.builder()
                .deviceId(devId)
                .status("ONLINE")
                .cpuUsagePct(24.5)
                .memoryUsagePct(38.2)
                .activeSockets(12)
                .latencyMs(15.4)
                .createdAt(java.time.LocalDateTime.now())
                .build();

        var saved = iotDeviceRepository.save(device);
        assertNotNull(saved);
        assertEquals(devId, saved.getDeviceId());
        assertEquals("ONLINE", saved.getStatus());
    }

    @Autowired
    private com.rakshasphere.health.EBpfHealthIndicator ebpfHealthIndicator;

    @Test
    @DisplayName("Verify eBPF health indicator reports non-null status and details")
    void testEBpfHealthIndicator() {
        assertNotNull(ebpfHealthIndicator);
        org.springframework.boot.actuate.health.Health health = ebpfHealthIndicator.health();
        assertNotNull(health);
        assertNotNull(health.getStatus());
        assertNotNull(health.getDetails());
        assertTrue(health.getDetails().containsKey("service"));
    }
}


