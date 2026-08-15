package com.rakshasphere.health;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Component;

@Component("redisIntegration")
public class RedisIntegrationHealthIndicator implements HealthIndicator {

    private static final Logger log = LoggerFactory.getLogger(RedisIntegrationHealthIndicator.class);

    private final RedisConnectionFactory redisConnectionFactory;

    @Autowired
    public RedisIntegrationHealthIndicator(RedisConnectionFactory redisConnectionFactory) {
        this.redisConnectionFactory = redisConnectionFactory;
    }

    @Override
    public Health health() {
        long start = System.currentTimeMillis();
        try (RedisConnection connection = redisConnectionFactory.getConnection()) {
            String pingResult = connection.ping();
            long latencyMs = System.currentTimeMillis() - start;

            if ("PONG".equalsIgnoreCase(pingResult)) {
                return Health.status(CustomHealthStatuses.HEALTHY)
                        .withDetail("service", "Redis Application Integration")
                        .withDetail("pingResponse", pingResult)
                        .withDetail("connectionValid", true)
                        .withDetail("latencyMs", latencyMs)
                        .build();
            } else {
                return Health.status(CustomHealthStatuses.DEGRADED)
                        .withDetail("service", "Redis Application Integration")
                        .withDetail("pingResponse", pingResult)
                        .withDetail("latencyMs", latencyMs)
                        .withDetail("issue", "Unexpected PING response from Redis")
                        .build();
            }
        } catch (Exception e) {
            long latencyMs = System.currentTimeMillis() - start;
            log.warn("Redis application integration health check failed: {}", e.getMessage());
            return Health.status(CustomHealthStatuses.DOWN)
                    .withDetail("service", "Redis Application Integration")
                    .withDetail("latencyMs", latencyMs)
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}
