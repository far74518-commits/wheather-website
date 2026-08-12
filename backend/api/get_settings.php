<?php
// backend/api/get_settings.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config.php';

// Create settings table if not exists
$conn->query("CREATE TABLE IF NOT EXISTS settings (
    `key` VARCHAR(100) NOT NULL PRIMARY KEY,
    `value` TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

// Insert default API key if not present
$conn->query("INSERT IGNORE INTO settings (`key`, `value`) VALUES ('owm_api_key', '91f9651a6fa348f23e20ce0a3ef9041f')");

$result = $conn->query("SELECT `key`, `value` FROM settings");
$settings = [];
while ($row = $result->fetch_assoc()) {
    $settings[$row['key']] = $row['value'];
}

echo json_encode(['status' => 'success', 'data' => $settings]);
