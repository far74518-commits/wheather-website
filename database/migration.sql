USE weather_db;

-- Drop old table
DROP TABLE IF EXISTS weather_data;

-- Add lat and lng columns to cities
ALTER TABLE cities ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 6) DEFAULT 0.0;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS lng DECIMAL(10, 6) DEFAULT 0.0;

-- Update coordinates for default cities
UPDATE cities SET lat = 24.8607, lng = 67.0011 WHERE name = 'Karachi';
UPDATE cities SET lat = 31.5497, lng = 74.3436 WHERE name = 'Lahore';
UPDATE cities SET lat = 33.6844, lng = 73.0479 WHERE name = 'Islamabad';
UPDATE cities SET lat = 33.5984, lng = 73.0441 WHERE name = 'Rawalpindi';
UPDATE cities SET lat = 34.0151, lng = 71.5249 WHERE name = 'Peshawar';
UPDATE cities SET lat = 30.1798, lng = 66.9750 WHERE name = 'Quetta';
UPDATE cities SET lat = 30.1575, lng = 71.5249 WHERE name = 'Multan';
UPDATE cities SET lat = 31.4187, lng = 73.0791 WHERE name = 'Faisalabad';
UPDATE cities SET lat = 25.3960, lng = 68.3578 WHERE name = 'Hyderabad';
UPDATE cities SET lat = 32.1617, lng = 74.1883 WHERE name = 'Gujranwala';
UPDATE cities SET lat = 32.4925, lng = 74.5310 WHERE name = 'Sialkot';
UPDATE cities SET lat = 27.7140, lng = 68.8517 WHERE name = 'Sukkur';
