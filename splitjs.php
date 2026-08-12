<?php
$lines = file('e:\\wheather wesite\\frontend\\client\\client.js');

// Remove the opening DOMContentLoaded wrapper (line 3, which is index 2)
if (strpos($lines[2], 'DOMContentLoaded') !== false) {
    unset($lines[2]);
}

// Remove the closing wrapper (last line or near last line)
for ($i = count($lines) - 1; $i >= 0; $i--) {
    if (trim($lines[$i]) === '});') {
        unset($lines[$i]);
        break;
    }
}

$lines = array_values($lines);
$files = [];
$cur = [];

foreach ($lines as $line) {
    $cur[] = $line;
    // Split at roughly 400 lines when we hit a closing brace
    if (count($cur) >= 400 && trim($line) === '}') {
        $files[] = implode('', $cur);
        $cur = [];
    }
}
if (count($cur) > 0) {
    $files[] = implode('', $cur);
}

foreach ($files as $i => $content) {
    file_put_contents('e:\\wheather wesite\\frontend\\client\\client-part'.($i+1).'.js', $content);
}
echo count($files);
unlink('e:\\wheather wesite\\frontend\\client\\client.js');
