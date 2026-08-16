package com.rakshasphere.health;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.io.File;
import java.time.Instant;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@Component("databaseBackup")
public class DatabaseBackupHealthIndicator implements HealthIndicator {

    private static final Logger log = LoggerFactory.getLogger(DatabaseBackupHealthIndicator.class);
    private static final String[] BACKUP_PATHS = {
            "/backups",
            "./backups",
            "../docker/backups",
            "/app/backups"
    };

    private static final long CACHE_TTL_MS = 60000; // 60s cache for backup directory scan
    private Health cachedHealth;
    private long lastCheckTime;

    @Override
    public synchronized Health health() {
        long now = System.currentTimeMillis();
        if (cachedHealth != null && (now - lastCheckTime) < CACHE_TTL_MS) {
            return cachedHealth;
        }

        cachedHealth = performBackupCheck();
        lastCheckTime = now;
        return cachedHealth;
    }

    private Health performBackupCheck() {
        Map<String, Object> details = new HashMap<>();
        details.put("service", "Database Backup Service");
        details.put("lastChecked", Instant.now().toString());

        File backupDir = null;
        for (String path : BACKUP_PATHS) {
            File dir = new File(path);
            if (dir.exists() && dir.isDirectory()) {
                backupDir = dir;
                break;
            }
        }

        if (backupDir == null) {
            details.put("backupFileExists", false);
            details.put("issue", "Persistent backup storage is not configured");
            return Health.status(CustomHealthStatuses.DEGRADED)
                    .withDetails(details)
                    .build();
        }

        File[] files = backupDir.listFiles((dir, name) -> name.endsWith(".sql") || name.endsWith(".sql.gz") || name.endsWith(".bak"));
        if (files == null || files.length == 0) {
            details.put("backupFileExists", false);
            details.put("issue", "No database backup files found in backup directory");
            return Health.status(CustomHealthStatuses.DEGRADED)
                    .withDetails(details)
                    .build();
        }

        Arrays.sort(files, (f1, f2) -> Long.compare(f2.lastModified(), f1.lastModified()));
        File latest = files[0];
        long ageHours = (System.currentTimeMillis() - latest.lastModified()) / (1000 * 60 * 60);

        details.put("latestBackupFile", latest.getName());
        details.put("lastBackupAgeHours", ageHours);
        details.put("fileSizeBytes", latest.length());
        details.put("fileSizeKb", latest.length() / 1024);
        details.put("lastSuccessfulCheck", Instant.now().toString());

        if (ageHours > 24) {
            details.put("issue", "Latest database backup is older than 24 hours");
            return Health.status(CustomHealthStatuses.DEGRADED)
                    .withDetails(details)
                    .build();
        }

        return Health.status(CustomHealthStatuses.HEALTHY)
                .withDetails(details)
                .build();
    }
}
