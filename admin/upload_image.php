<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
  echo json_encode(['ok' => false, 'error' => 'Unauthorized']);
  exit;
}

$targetDir = __DIR__ . '/img/';
if (!is_dir($targetDir)) {
  mkdir($targetDir, 0755, true);
}

if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
  echo json_encode(['ok' => false, 'error' => 'Upload failed']);
  exit;
}

$fileName = basename($_FILES['image']['name']);
$targetFile = $targetDir . $fileName;

// Prevent overwriting existing file
$baseName = pathinfo($fileName, PATHINFO_FILENAME);
$ext = pathinfo($fileName, PATHINFO_EXTENSION);
$counter = 1;
while (file_exists($targetFile)) {
  $fileName = $baseName . '_' . $counter . '.' . $ext;
  $targetFile = $targetDir . $fileName;
  $counter++;
}

if (move_uploaded_file($_FILES['image']['tmp_name'], $targetFile)) {
  echo json_encode(['ok' => true, 'filename' => $fileName]);
} else {
  echo json_encode(['ok' => false, 'error' => 'Failed to save file']);
}