<?php
// backend/api/add_city.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->name) || !isset($data->lat) || !isset($data->lng)) {
    echo json_encode(["status" => "error", "message" => "Missing required fields (name, lat, lng)."]);
    exit;
}

$name = $conn->real_escape_string($data->name);
$lat = floatval($data->lat);
$lng = floatval($data->lng);

$sql = "INSERT INTO cities (name, lat, lng) VALUES (?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sdd", $name, $lat, $lng);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "City added successfully."]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to add city. It might already exist."]);
}

$stmt->close();
$conn->close();
?>
