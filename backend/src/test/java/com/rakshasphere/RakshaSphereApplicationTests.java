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
    @DisplayName("Verify internal IP addresses return clean threat intel scores")
    void testInternalIpThreatIntel() {
        Map<String, String> intel = threatIntelService.enrichIpData("192.168.1.100").block();
        assertNotNull(intel);
        assertEquals("0/90 Clean", intel.get("virusTotalScore"));
        assertEquals("0", intel.get("abuseIpDbConfidence"));
        assertEquals("Internal Network", intel.get("geoCountry"));
    }

    @Test
    @DisplayName("Verify unconfigured external IP threat intel returns non-blocking status")
    void testExternalUnconfiguredThreatIntel() {
        Map<String, String> intel = threatIntelService.enrichIpData("1.1.1.1").block();
        assertNotNull(intel);
        assertEquals("NOT_CONFIGURED", intel.get("virusTotalScore"));
        assertEquals("NOT_CONFIGURED", intel.get("abuseIpDbConfidence"));
    }
}
