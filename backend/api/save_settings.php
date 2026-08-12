<?php
// backend/api/save_settings.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

// Ensure settings table exists
$conn->query("CREATE TABLE IF NOT EXISTS settings (
    `key` VARCHAR(100) NOT NULL PRIMARY KEY,
    `value` TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)");

$body = json_decode(file_get_contents('php://input'), true);

if (empty($body) || !isset($body['key']) || !isset($body['value'])) {
    echo json_encode(['status' => 'error', 'message' => 'Missing key or value.']);
    exit;
}

$key   = $conn->real_escape_string(trim($body['key']));
$value = $conn->real_escape_string(trim($body['value']));

if (empty($value)) {
    echo json_encode(['status' => 'error', 'message' => 'Value cannot be empty.']);
    exit;
}

$sql = "INSERT INTO settings (`key`, `value`) VALUES ('$key', '$value')
        ON DUPLICATE KEY UPDATE `value` = '$value'";

if ($conn->query($sql)) {
    echo json_encode(['status' => 'success', 'message' => 'Setting saved successfully.']);
} else {
    echo json_encode(['status' => 'error', 'message' => $conn->error]);
}
