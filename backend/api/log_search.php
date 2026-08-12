<?php
// backend/api/log_search.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once '../config.php';

// Create search_logs table if not exists
$conn->query("CREATE TABLE IF NOT EXISTS search_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL,
    search_date DATE NOT NULL,
    search_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$data = json_decode(file_get_contents('php://input'), true);
$city_name = $data['city_name'] ?? '';

if (empty($city_name)) {
    echo json_encode(['status' => 'error', 'message' => 'City name is required']);
    exit;
}

$city_name = $conn->real_escape_string($city_name);
$date = date('Y-m-d');

$query = "INSERT INTO search_logs (city_name, search_date) VALUES ('$city_name', '$date')";
if ($conn->query($query)) {
    echo json_encode(['status' => 'success', 'message' => 'Search logged']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to log search']);
}
