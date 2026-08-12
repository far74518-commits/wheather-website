<?php
// backend/api/login.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

// Check if request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
    exit;
}

// Get JSON data
$data = json_decode(file_get_contents("php://input"));

if (!isset($data->username) || !isset($data->password)) {
    echo json_encode(["status" => "error", "message" => "Username and password required."]);
    exit;
}

$username = $conn->real_escape_string($data->username);
$password = md5($data->password); // Using MD5 as per our DB schema

$sql = "SELECT id, username FROM users WHERE username = ? AND password = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $username, $password);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    echo json_encode(["status" => "success", "message" => "Login successful", "user" => $user]);
} else {
    echo json_encode(["status" => "error", "message" => "Invalid username or password."]);
}

$stmt->close();
$conn->close();
?>
