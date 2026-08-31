<?php
require_once __DIR__ . '/../includes/bootstrap.php';
require_method('POST');

$body = json_body();
$username = trim($body['username'] ?? '');
$password = $body['password'] ?? '';

if ($username === '' || $password === '') {
    send_json(['error' => 'Podaj login i hasło'], 400);
}

$stmt = $pdo->prepare('SELECT * FROM users WHERE username = ?');
$stmt->execute([$username]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    send_json(['error' => 'Nieprawidłowy login lub hasło'], 401);
}

$_SESSION['user'] = ['id' => (int) $user['id'], 'username' => $user['username'], 'role' => $user['role']];
send_json(['user' => $_SESSION['user']]);
