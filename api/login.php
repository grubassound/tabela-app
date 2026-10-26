<?php
require_once __DIR__ . '/../includes/bootstrap.php';
require_method('POST');

// Ochrona przed zgadywaniem haseł: max 10 nieudanych prób z jednego IP w ciągu 15 minut
const LOGIN_MAX_ATTEMPTS = 10;
const LOGIN_WINDOW_MINUTES = 15;

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';

$pdo->prepare('DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL ' . LOGIN_WINDOW_MINUTES . ' MINUTE')->execute();
$stmt = $pdo->prepare('SELECT COUNT(*) FROM login_attempts WHERE ip = ?');
$stmt->execute([$ip]);
if ((int) $stmt->fetchColumn() >= LOGIN_MAX_ATTEMPTS) {
    send_error('TOO_MANY_ATTEMPTS', 'Too many failed login attempts. Please try again later.', 429);
}

$body = json_body();
$username = trim((string) ($body['username'] ?? ''));
$password = (string) ($body['password'] ?? '');

if ($username === '' || $password === '') {
    send_error('LOGIN_PASSWORD_REQUIRED', 'Please provide a username and password.', 400);
}

$stmt = $pdo->prepare('SELECT * FROM users WHERE username = ?');
$stmt->execute([$username]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    $pdo->prepare('INSERT INTO login_attempts (ip) VALUES (?)')->execute([$ip]);
    send_error('INVALID_CREDENTIALS', 'Invalid username or password.', 401);
}

$pdo->prepare('DELETE FROM login_attempts WHERE ip = ?')->execute([$ip]);

// Nowy identyfikator sesji po zalogowaniu (ochrona przed session fixation)
session_regenerate_id(true);
$_SESSION['user'] = ['id' => (int) $user['id'], 'username' => $user['username'], 'role' => $user['role']];
send_json(['user' => $_SESSION['user']]);
