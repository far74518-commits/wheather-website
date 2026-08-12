<?php
// backend/api/get_visitors.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$file = 'visitors.json';
$visitors = [];
$activeMembers = 0;
$pageCounts = [];
$mostVisitedPage = 'N/A';

if (file_exists($file)) {
    $content = file_get_contents($file);
    if ($content) {
        $visitors = json_decode($content, true) ?: [];
    }
}

$now = time();
$activeVisitors = [];
foreach ($visitors as $vip => $data) {
    if ($now - $data['last_seen'] < 120) {
        $activeVisitors[$vip] = $data;
        $activeMembers++;
        
        $p = $data['page'];
        if (!isset($pageCounts[$p])) {
            $pageCounts[$p] = 0;
        }
        $pageCounts[$p]++;
    }
}

// Write cleaned data back
file_put_contents($file, json_encode($activeVisitors));

if (!empty($pageCounts)) {
    arsort($pageCounts);
    $mostVisitedPage = array_key_first($pageCounts);
}

echo json_encode([
    "status" => "success", 
    "active_members" => $activeMembers,
    "most_visited_page" => $mostVisitedPage,
    "page_stats" => $pageCounts
]);
?>
