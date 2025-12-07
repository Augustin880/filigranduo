<?php
header('Content-Type: application/json');

$file = __DIR__ . '/../data/gallery.json';

// If file doesn't exist, return empty structure
if (!file_exists($file)) {
    echo json_encode([
        'photos' => [],
        'videos' => []
    ]);
    exit;
}

// Read file
$json = file_get_contents($file);
$data = json_decode($json, true);

// If invalid JSON, fail safely
if (!is_array($data)) {
    echo json_encode([
        'photos' => [],
        'videos' => []
    ]);
    exit;
}

// Normalize output
$photos = [];
$videos = [];

if (isset($data['photos']) && is_array($data['photos'])) {
    foreach ($data['photos'] as $p) {
        if (is_string($p) && strpos($p, '/img/photos/') === 0) {
            $photos[] = $p;
        }
    }
}

if (isset($data['videos']) && is_array($data['videos'])) {
    foreach ($data['videos'] as $v) {
        if (is_string($v)) {
            $v = trim($v);
            if ($v !== '') {
                $videos[] = $v;
            }
        }
    }
}

echo json_encode([
    'photos' => $photos,
    'videos' => $videos
]);
