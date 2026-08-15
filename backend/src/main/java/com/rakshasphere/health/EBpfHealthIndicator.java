package com.rakshasphere.health;

import com.rakshasphere.service.EBpfDriver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component("eBpfSubsystem")
public class EBpfHealthIndicator implements HealthIndicator {

    private final EBpfDriver eBpfDriver;

    @Autowired
    public EBpfHealthIndicator(EBpfDriver eBpfDriver) {
        this.eBpfDriver = eBpfDriver;
    }

    @Override
    public Health health() {
        boolean nativeLoaded = eBpfDriver != null && eBpfDriver.isNativeLoaded();

        // In the current architecture, eBPF is a JNI simulated prototype / mock drop rule driver.
        // As per system health rules, simulated prototypes MUST report SIMULATED state.
        return Health.status(CustomHealthStatuses.SIMULATED)
                .withDetail("service", "RakshaSphere eBPF Network Defense Subsystem")
                .withDetail("simulated", true)
                .withDetail("nativeJniLoaded", nativeLoaded)
                .withDetail("kernelXdpAttached", false)
                .withDetail("notice", "Component is intentionally represented by a JNI simulation prototype rather than real kernel XDP driver")
                .build();
    }
}
