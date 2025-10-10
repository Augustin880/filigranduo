<?php
$imgDir = __DIR__ . '/img';
$files = array_values(array_filter(scandir($imgDir), function($f) use ($imgDir) {
  return !is_dir("$imgDir/$f") && preg_match('/\.(png|jpe?g|gif|webp|svg)$/i', $f);
}));
header('Content-Type: application/json');
echo json_encode(['images' => $files]);
