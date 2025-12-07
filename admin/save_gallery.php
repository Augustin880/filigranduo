<?php
header('Content-Type: application/json');

$file = __DIR__ . '/../data/gallery.json';

$input = json_decode(file_get_contents('php://input'), true);

if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
    exit;
}

// Normalize & sanitize
$gallery = [
    'photos' => [],
    'videos' => []
];

// Keep only valid-looking photo paths
if (isset($input['photos']) && is_array($input['photos'])) {
    foreach ($input['photos'] as $p) {
        if (is_string($p) && str_starts_with($p, '/img/photos/')) {
            $gallery['photos'][] = $p;
        }
    }
}

// Keep only non-empty video strings
if (isset($input['videos']) && is_array($input['videos'])) {
    foreach ($input['videos'] as $v) {
        if (is_string($v)) {
            $v = trim($v);
            if ($v !== '') {
                $gallery['videos'][] = $v;
            }
        }
    }
}

// Ensure data directory exists
$dir = dirname($file);
if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
}

// Write JSON
if (file_put_contents(
    $file,
    json_encode($gallery, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
) === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to write file']);
    exit;
}

echo json_encode(['ok' => true]);
