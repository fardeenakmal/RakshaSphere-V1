/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-11.8.8-MariaDB, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: rakshaspheredb
-- ------------------------------------------------------
-- Server version	12.3.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` varchar(50) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `actor` varchar(100) NOT NULL,
  `action` varchar(100) NOT NULL,
  `target` varchar(255) NOT NULL,
  `status` varchar(20) NOT NULL,
  `crypto_hash` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_master_audit_logs_timestamp` (`timestamp` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES
('LOG-1e4f5a91','2026-08-11 07:37:43','SYSTEM/ANONYMOUS','login','com.rakshasphere.controller.AuthController','SUCCESS','739fc5c307ab516b729c730dc043aa3402b09d764a6137288cb99298010edf2f'),
('LOG-62f11e53','2026-08-11 07:37:45','admin','getSystemMetrics','com.rakshasphere.controller.SocDashboardController','SUCCESS','0ef31501a6890a6e60c8b5e4643a3b0de425a21b780277daae9fe61e5e160243'),
('LOG-a30ac58a','2026-08-11 07:37:38','SYSTEM/ANONYMOUS','login','com.rakshasphere.controller.AuthController','SUCCESS','d0fba9d370ee227bdfa8b473e3c500ef0ffbd09a13dc0c4db9183f40451ee746'),
('LOG-bf2debd6','2026-08-11 07:37:45','admin','getSystemMetrics','com.rakshasphere.controller.SocDashboardController','SUCCESS','bd8b8715fdd50f2ca7d4d52363f619cc23dcd4e66ba13a8efd3ec6ac878868fe');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `honeypot_sessions`
--

DROP TABLE IF EXISTS `honeypot_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `honeypot_sessions` (
  `id` varchar(50) NOT NULL,
  `service` varchar(20) NOT NULL,
  `container_id` varchar(100) NOT NULL,
  `attacker_ip` varchar(45) NOT NULL,
  `port` int(11) NOT NULL,
  `start_time` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(20) NOT NULL,
  `keystrokes_json` text DEFAULT NULL,
  `commands_json` text DEFAULT NULL,
  `payloads_captured` int(11) DEFAULT 0,
  `risk_score` int(11) DEFAULT 50,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `honeypot_sessions`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `honeypot_sessions` WRITE;
/*!40000 ALTER TABLE `honeypot_sessions` DISABLE KEYS */;
INSERT INTO `honeypot_sessions` VALUES
('HP-HTTP-02','HTTP','docker-trap-web-3c1b','198.51.100.42',8080,'2026-08-11 07:07:27','RUNNING','[\"GET /admin/login.php?user=admin\' OR 1=1--\"]','[\"SQL injection probe\"]',5,92),
('HP-SSH-01','SSH','docker-trap-ssh-7f9a','185.220.101.5',2222,'2026-08-11 06:37:27','RUNNING','[\"ssh root@192.168.10.45\", \"uname -a\", \"cat /etc/passwd\"]','[\"uname -a\", \"cat /etc/passwd\"]',3,88);
/*!40000 ALTER TABLE `honeypot_sessions` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `mitre_tactics`
--

DROP TABLE IF EXISTS `mitre_tactics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `mitre_tactics` (
  `id` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mitre_tactics`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `mitre_tactics` WRITE;
/*!40000 ALTER TABLE `mitre_tactics` DISABLE KEYS */;
/*!40000 ALTER TABLE `mitre_tactics` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `mitre_techniques`
--

DROP TABLE IF EXISTS `mitre_techniques`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `mitre_techniques` (
  `id` varchar(20) NOT NULL,
  `tactic_id` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `mitigation_playbook` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_master_technique_tactic` (`tactic_id`),
  CONSTRAINT `fk_master_technique_tactic` FOREIGN KEY (`tactic_id`) REFERENCES `mitre_tactics` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mitre_techniques`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `mitre_techniques` WRITE;
/*!40000 ALTER TABLE `mitre_techniques` DISABLE KEYS */;
/*!40000 ALTER TABLE `mitre_techniques` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES
(1,'ROLE_ADMIN','Administrator with full self-healing rule control','2026-08-11 13:03:14'),
(2,'ROLE_SOC_ANALYST','SOC Security Analyst with triage capabilities','2026-08-11 13:03:14'),
(3,'ROLE_USER','Executive viewer with read-only dashboard permissions','2026-08-11 13:03:14');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `security_alerts`
--

DROP TABLE IF EXISTS `security_alerts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `security_alerts` (
  `id` varchar(50) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp(),
  `source_ip` varchar(45) NOT NULL,
  `destination_ip` varchar(45) NOT NULL,
  `source_port` int(11) NOT NULL,
  `destination_port` int(11) NOT NULL,
  `attack_type` varchar(100) NOT NULL,
  `severity` enum('CRITICAL','HIGH','MEDIUM','LOW','INFO') NOT NULL,
  `risk_score` int(11) NOT NULL,
  `confidence_score` double NOT NULL,
  `mitre_tactic` varchar(100) NOT NULL,
  `mitre_technique` varchar(100) NOT NULL,
  `mitre_id` varchar(30) NOT NULL,
  `status` enum('ACTIVE','CONTAINED','HONEYPOT_DIVERTED','RESOLVED','IGNORED') NOT NULL,
  `remediation_action` varchar(255) DEFAULT NULL,
  `flow_duration_ms` bigint(20) DEFAULT NULL,
  `total_fwd_packets` int(11) DEFAULT NULL,
  `packet_length_mean` double DEFAULT NULL,
  `anomaly_score` double DEFAULT NULL,
  `virustotal_score` varchar(50) DEFAULT NULL,
  `abuseipdb_confidence` int(11) DEFAULT NULL,
  `geo_country` varchar(50) DEFAULT NULL,
  `isp_name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_master_alerts_source_ip` (`source_ip`),
  KEY `idx_master_alerts_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `security_alerts`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `security_alerts` WRITE;
/*!40000 ALTER TABLE `security_alerts` DISABLE KEYS */;
/*!40000 ALTER TABLE `security_alerts` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `role_id` bigint(20) DEFAULT 1,
  `role` enum('ROLE_ADMIN','ROLE_SOC_ANALYST','ROLE_USER') NOT NULL,
  `avatar_url` varchar(255) DEFAULT NULL,
  `status` enum('PENDING','ACTIVE','DISABLED') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `mfa_enabled` bit(1) DEFAULT NULL,
  `mfa_secret` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_master_users_role` (`role_id`),
  CONSTRAINT `fk_master_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'admin','sarah.c@rakshasphere.internal','$2a$10$OkYmxE6m5bR4Rp8c2aA0eeGn/0mms.QKLy6lPpMu6/JDaghmIa69O','Sarah Connor',1,'ROLE_ADMIN','https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80','ACTIVE','2026-08-11 13:03:15',0x00,NULL),
(2,'analyst_mike','mike.r@rakshasphere.internal','$2a$10$VCB923pHoL5vGmsLiu.lduY4G2gsq1h808eMmJkZNxCKk6LhEMX02','Mike Ross',2,'ROLE_SOC_ANALYST','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80','ACTIVE','2026-08-11 13:03:15',0x00,NULL),
(3,'user','user@rakshasphere.internal','$2a$10$chejTTJLFwOqXN7UlgLBh.TZ8P1Nj1iuAEfQeANdKoNwcAIB67QeC','Executive Viewer',3,'ROLE_USER','https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80','ACTIVE','2026-08-11 07:37:29',0x00,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-08-11 13:07:46
