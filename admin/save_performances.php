<?php
session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/../../private/config.php';

if (empty($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
  http_response_code(401);
  echo json_encode(['error' => 'Unauthorized']);
  exit;
}

$body = json_decode(file_get_contents('php://input'), true);
if (!isset($body['performances'])) {
  http_response_code(400);
  echo json_encode(['error' => 'Missing performances']);
  exit;
}

$performances = $body['performances'];
$localPath = __DIR__ . '/../data/performances.json';
file_put_contents($localPath, json_encode(['performances' => $performances], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
