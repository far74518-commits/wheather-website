-- Database Schema for Pakistan Weather Website
CREATE DATABASE IF NOT EXISTS weather_db;
USE weather_db;

-- Users table for Admin login
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- Insert default admin (username: admin, password: password123)
-- MD5 hash for password123 is 482c811da5d5b4bc6d497ffa98491e38 (Using plain MD5 for simplicity as in previous project, though bcrypt is recommended in prod)
INSERT INTO users (username, password) VALUES ('admin', '482c811da5d5b4bc6d497ffa98491e38')
ON DUPLICATE KEY UPDATE username=username;

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Insert default Pakistan cities
INSERT IGNORE INTO cities (name) VALUES 
('Karachi'), ('Lahore'), ('Islamabad'), ('Rawalpindi'), 
('Peshawar'), ('Quetta'), ('Multan'), ('Faisalabad'), 
('Hyderabad'), ('Gujranwala'), ('Sialkot'), ('Sukkur');

-- Weather data table
CREATE TABLE IF NOT EXISTS weather_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_id INT NOT NULL,
    temperature DECIMAL(5,2) NOT NULL,
    humidity INT NOT NULL,
    conditions VARCHAR(100) NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE,
    UNIQUE KEY (city_id)
);

-- Insert some dummy weather data
INSERT IGNORE INTO weather_data (city_id, temperature, humidity, conditions) VALUES 
((SELECT id FROM cities WHERE name='Karachi'), 32.5, 75, 'Sunny'),
((SELECT id FROM cities WHERE name='Lahore'), 35.0, 60, 'Clear'),
((SELECT id FROM cities WHERE name='Islamabad'), 28.0, 50, 'Partly Cloudy');
