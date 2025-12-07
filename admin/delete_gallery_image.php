<?php
header('Content-Type: application/json');

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!isset($data['path'])) {
    echo json_encode(['ok' => false, 'error' => 'Missing path']);
    exit;
}

$path = $data['path'];

// Security: only allow gallery photos
if (strpos($path, '/img/photos/') !== 0) {
    echo json_encode(['ok' => false, 'error' => 'Invalid path']);
    exit;
}

$file = __DIR__ . '/..' . $path;

if (file_exists($file)) {
    unlink($file);
}

echo json_encode(['ok' => true]);
