-- Unique Constraints and Check Conditions for Data Integrity

-- Unique Constraints for User Handles & Emails
ALTER TABLE users ADD CONSTRAINT uk_users_username UNIQUE (username);
ALTER TABLE users ADD CONSTRAINT uk_users_email UNIQUE (email);

-- Check Constraint on Risk Scores
ALTER TABLE security_alerts ADD CONSTRAINT chk_security_alerts_risk_score CHECK (risk_score >= 0 AND risk_score <= 100);
