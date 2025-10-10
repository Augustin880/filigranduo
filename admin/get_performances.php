<?php
header('Content-Type: application/json');

$file = __DIR__ . '/../data/performances.json';

if (!file_exists($file)) {
  http_response_code(404);
  echo json_encode(['error' => 'File not found']);
  exit;
}

echo file_get_contents($file);
