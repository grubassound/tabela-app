<?php
require_once __DIR__ . '/../includes/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    send_json(['user' => current_user()]);
}

if ($method === 'PUT') {
    $user = require_auth();
    $body = json_body();
    $currentPassword = $body['currentPassword'] ?? '';
    $newPassword = $body['newPassword'] ?? '';

    if ($currentPassword === '' || $newPassword === '') {
        send_json(['error' => 'Podaj obecne i nowe hasło'], 400);
    }
    if (strlen($newPassword) < 6) {
        send_json(['error' => 'Nowe hasło musi mieć co najmniej 6 znaków'], 400);
    }

    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$user['id']]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($currentPassword, $row['password_hash'])) {
        send_json(['error' => 'Obecne hasło jest nieprawidłowe'], 401);
    }

    $hash = password_hash($newPassword, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    $stmt->execute([$hash, $user['id']]);

    send_json(['ok' => true]);
}

send_json(['error' => 'Niedozwolona metoda'], 405);
