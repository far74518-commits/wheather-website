<?php
// backend/api/get_cities.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config.php';

$sql = "SELECT id, name, lat, lng FROM cities ORDER BY name ASC";
$result = $conn->query($sql);

$cities = [];
if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $cities[] = $row;
    }
}

echo json_encode(["status" => "success", "data" => $cities]);
$conn->close();
?>
