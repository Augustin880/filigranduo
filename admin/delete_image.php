<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
  echo json_encode(['ok' => false, 'error' => 'Unauthorized']);
  exit;
}

$targetDir = __DIR__ . '/img';

// Expect JSON body or form field 'filename'
$filename = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  // Try JSON body
  $body = file_get_contents('php://input');
  $data = json_decode($body, true);
  if (!empty($data['filename'])) $filename = $data['filename'];
  // fallback to form-encoded
  if (empty($filename) && isset($_POST['filename'])) $filename = $_POST['filename'];
}

if (empty($filename)) {
  echo json_encode(['ok' => false, 'error' => 'No filename provided']);
  exit;
}

// Prevent directory traversal
$basename = basename($filename);
if ($basename !== $filename) {
  echo json_encode(['ok' => false, 'error' => 'Invalid filename']);
  exit;
}

$fullPath = $targetDir . $basename;
if (!file_exists($fullPath)) {
  echo json_encode(['ok' => false, 'error' => 'File not found']);
  exit;
}

if (!is_file($fullPath)) {
  echo json_encode(['ok' => false, 'error' => 'Not a file']);
  exit;
}

if (unlink($fullPath)) {
  echo json_encode(['ok' => true]);
} else {
  echo json_encode(['ok' => false, 'error' => 'Failed to delete file']);
}
