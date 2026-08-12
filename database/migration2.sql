USE weather_db;

-- Search logs table to track what clients search
CREATE TABLE IF NOT EXISTS search_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL,
    lat DECIMAL(10,6),
    lng DECIMAL(10,6),
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weather alerts table (admin can post alerts for cities)
CREATE TABLE IF NOT EXISTS weather_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL,
    alert_type ENUM('rain','storm','heat','flood','fog','other') DEFAULT 'other',
    message TEXT NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
