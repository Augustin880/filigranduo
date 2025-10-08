<?php
session_start();

require_once __DIR__ . '/../../private/config.php';

// only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

// read JSON body
$body = json_decode(file_get_contents('php://input'), true);
$user = $body['username'] ?? '';
$pass = $body['password'] ?? '';

if ($user === USER && password_verify($pass, PWD)) {
  // regenerate session id for security
  session_regenerate_id(true);
  $_SESSION['logged_in'] = true;
  $_SESSION['user'] = USER;
  echo json_encode(['ok' => true]);
  exit;
}

http_response_code(401);
echo json_encode(['error' => 'Invalid credentials']);
