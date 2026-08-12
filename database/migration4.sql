-- Database Schema for User Search Tracking
USE weather_db;

CREATE TABLE IF NOT EXISTS search_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL,
    search_date DATE NOT NULL,
    search_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
