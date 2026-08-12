<?php
// backend/api/track_visitor.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$page = isset($_GET['page']) ? $_GET['page'] : 'Unknown';
$ip = $_SERVER['REMOTE_ADDR'];
if (empty($ip)) {
    $ip = '127.0.0.1';
}

$file = 'visitors.json';
$visitors = [];

if (file_exists($file)) {
    $content = file_get_contents($file);
    if ($content) {
        $visitors = json_decode($content, true) ?: [];
    }
}

$now = time();
$visitors[$ip] = [
    'page' => $page,
    'last_seen' => $now
];

// Clean up old visitors (inactive for > 2 minutes)
$activeVisitors = [];
foreach ($visitors as $vip => $data) {
    if ($now - $data['last_seen'] < 120) {
        $activeVisitors[$vip] = $data;
    }
}

file_put_contents($file, json_encode($activeVisitors));
echo json_encode(["status" => "success", "active" => count($activeVisitors)]);
?>
