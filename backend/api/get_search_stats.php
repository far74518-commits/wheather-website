<?php
// backend/api/get_search_stats.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once '../config.php';

// Ensure table exists just in case
$conn->query("CREATE TABLE IF NOT EXISTS search_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL,
    search_date DATE NOT NULL,
    search_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$date = date('Y-m-d');

// Get total searches for today
$total_query = $conn->query("SELECT COUNT(*) as total FROM search_logs WHERE search_date = '$date'");
$total_row = $total_query->fetch_assoc();
$total_searches = (int)$total_row['total'];

// Get searches grouped by city for today
$stats_query = $conn->query("
    SELECT city_name, COUNT(*) as count 
    FROM search_logs 
    WHERE search_date = '$date' 
    GROUP BY city_name 
    ORDER BY count DESC
");

$city_stats = [];
while ($row = $stats_query->fetch_assoc()) {
    $count = (int)$row['count'];
    $percentage = $total_searches > 0 ? round(($count / $total_searches) * 100, 1) : 0;
    
    $city_stats[] = [
        'city' => $row['city_name'],
        'count' => $count,
        'percentage' => $percentage
    ];
}

echo json_encode([
    'status' => 'success',
    'data' => [
        'total' => $total_searches,
        'cities' => $city_stats
    ]
]);
