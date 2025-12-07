<?php
header('Content-Type: application/json');

// === CONFIG ===
$uploadDir = __DIR__ . '/../img/photos/';
$publicPath = '/img/photos/';

// === SECURITY CHECK ===
if (!isset($_FILES['image'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'No file uploaded']);
    exit;
}

$file = $_FILES['image'];

if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Upload error']);
    exit;
}

// === VALIDATE MIME TYPE ===
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']);

$allowed = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp'
];

if (!isset($allowed[$mime])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid image type']);
    exit;
}

// === ENSURE DIRECTORY EXISTS ===
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'Upload directory not writable']);
        exit;
    }
}

// === GENERATE SAFE UNIQUE FILENAME ===
$extension = $allowed[$mime];
$filename = 'gallery_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . '.' . $extension;
$targetPath = $uploadDir . $filename;

// === MOVE FILE ===
if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Failed to save image']);
    exit;
}

// === SUCCESS RESPONSE ===
echo json_encode([
    'ok'   => true,
    'path' => $publicPath . $filename
]);
