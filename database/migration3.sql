-- Settings table for API key management
USE weather_db;

CREATE TABLE IF NOT EXISTS settings (
    `key` VARCHAR(100) NOT NULL PRIMARY KEY,
    `value` TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default OWM API key
INSERT INTO settings (`key`, `value`) VALUES ('owm_api_key', '91f9651a6fa348f23e20ce0a3ef9041f')
ON DUPLICATE KEY UPDATE `value` = `value`;
