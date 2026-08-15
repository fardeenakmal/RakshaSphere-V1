package com.rakshasphere.health;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@Component("mysqlDatabase")
public class MySqlHealthIndicator implements HealthIndicator {

    private static final Logger log = LoggerFactory.getLogger(MySqlHealthIndicator.class);

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    @Autowired
    public MySqlHealthIndicator(JdbcTemplate jdbcTemplate, DataSource dataSource) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
    }

    @Override
    public Health health() {
        long start = System.currentTimeMillis();
        try {
            // 1. Connection check
            try (Connection conn = dataSource.getConnection()) {
                boolean isValid = conn.isValid(2);
                if (!isValid) {
                    return Health.status(CustomHealthStatuses.DOWN)
                            .withDetail("database", "MySQL")
                            .withDetail("issue", "Database connection is invalid")
                            .build();
                }
            }

            // 2. Query execution check (SELECT 1)
            Integer queryResult = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            long latencyMs = System.currentTimeMillis() - start;

            // 3. Connection pool metrics
            Map<String, Object> poolMetrics = new HashMap<>();
            if (dataSource instanceof HikariDataSource hikariDS) {
                if (hikariDS.getHikariPoolMXBean() != null) {
                    poolMetrics.put("activeConnections", hikariDS.getHikariPoolMXBean().getActiveConnections());
                    poolMetrics.put("idleConnections", hikariDS.getHikariPoolMXBean().getIdleConnections());
                    poolMetrics.put("totalConnections", hikariDS.getHikariPoolMXBean().getTotalConnections());
                    poolMetrics.put("threadsAwaiting", hikariDS.getHikariPoolMXBean().getThreadsAwaitingConnection());
                }
                poolMetrics.put("maxPoolSize", hikariDS.getMaximumPoolSize());
                poolMetrics.put("poolName", hikariDS.getPoolName());
            }

            // 4. Schema verification check (verify users table existence)
            boolean schemaReady = false;
            try {
                Integer userCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
                schemaReady = userCount != null;
            } catch (Exception e) {
                log.warn("MySQL schema check query warning: {}", e.getMessage());
            }

            if (queryResult != null && queryResult == 1 && schemaReady) {
                return Health.status(CustomHealthStatuses.HEALTHY)
                        .withDetail("database", "MySQL")
                        .withDetail("connectionValid", true)
                        .withDetail("validationQuery", "SELECT 1")
                        .withDetail("latencyMs", latencyMs)
                        .withDetail("schemaReady", true)
                        .withDetail("connectionPool", poolMetrics)
                        .build();
            } else {
                return Health.status(CustomHealthStatuses.DEGRADED)
                        .withDetail("database", "MySQL")
                        .withDetail("connectionValid", true)
                        .withDetail("validationQuery", "SELECT 1")
                        .withDetail("latencyMs", latencyMs)
                        .withDetail("schemaReady", schemaReady)
                        .withDetail("issue", "Schema validation failed or unexpected query result")
                        .build();
            }

        } catch (Exception e) {
            long latencyMs = System.currentTimeMillis() - start;
            log.error("MySQL health check failure: {}", e.getMessage());
            return Health.status(CustomHealthStatuses.DOWN)
                    .withDetail("database", "MySQL")
                    .withDetail("latencyMs", latencyMs)
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}
