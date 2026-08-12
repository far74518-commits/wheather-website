<?php
// backend/api/delete_city.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
    exit;
}

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;

if ($id <= 0) {
    echo json_encode(["status" => "error", "message" => "Invalid city ID."]);
    exit;
}

$stmt = $conn->prepare("DELETE FROM cities WHERE id = ?");
$stmt->bind_param("i", $id);

if ($stmt->execute() && $stmt->affected_rows > 0) {
    echo json_encode(["status" => "success", "message" => "City deleted."]);
} else {
    echo json_encode(["status" => "error", "message" => "City not found or already deleted."]);
}

$stmt->close();
$conn->close();
?>
