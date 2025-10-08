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

$repo = REPO;
$path = "/data/performances.json";
$branch = "main";
$token = GHP;

$apiUrl = "https://api.github.com/repos/{$repo}/contents/{$path}?ref={$branch}";
$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  "Authorization: token {$token}",
  "User-Agent: filigranduo-admin"
]);
$res = curl_exec($ch);
$info = curl_getinfo($ch);
curl_close($ch);

if ($info['http_code'] >= 400) {
  $sha = null;
} else {
  $fileData = json_decode($res, true);
  $sha = $fileData['sha'] ?? null;
}

$newContent = json_encode(['performances' => $performances], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
$b64 = base64_encode($newContent);

$payload = [
  'message' => 'Update performances.json via admin',
  'content' => $b64,
  'branch' => $branch
];
if ($sha) $payload['sha'] = $sha;

$putUrl = "https://api.github.com/repos/{$repo}/contents/{$path}";
$ch = curl_init($putUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
  "Authorization: token {$token}",
  "User-Agent: filigranduo-admin",
  "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
$res2 = curl_exec($ch);
$info2 = curl_getinfo($ch);
curl_close($ch);

if ($info2['http_code'] >= 200 && $info2['http_code'] < 300) {
  echo json_encode(['ok' => true, 'github' => json_decode($res2, true)]);
} else {
  http_response_code(500);
  echo json_encode(['error' => 'GitHub commit failed', 'response' => json_decode($res2, true)]);
}