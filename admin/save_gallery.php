<?php
header('Content-Type: application/json');

$file = __DIR__ . '/../data/gallery.json';

// Read raw JSON input
$raw = file_get_contents('php://input');
if ($raw === false) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'No input']);
  exit;
}

$data = json_decode($raw, true);

if (!is_array($data)) {
  http_response_code(400);
  echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
  exit;
}

$photos = isset($data['photos']) && is_array($data['photos'])
  ? $data['photos']
  : [];

$videos = isset($data['videos']) && is_array($data['videos'])
  ? $data['videos']
  : [];

// Save JSON (pretty for sanity)
$payload = [
  'photos' => array_values($photos),
  'videos' => array_values($videos),
];

if (file_put_contents($file, json_encode($payload, JSON_PRETTY_PRINT)) === false) {
  http_response_code(500);
  echo json_encode(['ok' => false, 'error' => 'Failed to write file']);
  exit;
}

// ✅ ALWAYS return valid JSON
echo json_encode(['ok' => true]);
