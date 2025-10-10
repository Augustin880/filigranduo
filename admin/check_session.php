<?php
session_start();
header('Content-Type: application/json');
if (!empty($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
  echo json_encode(['logged_in' => true, 'user' => $_SESSION['user']]);
} else {
  echo json_encode(['logged_in' => false]);
}
