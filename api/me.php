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
        send_error('CURRENT_NEW_PASSWORD_REQUIRED', 'Please provide your current and new password.', 400);
    }
    if (strlen($newPassword) < 6) {
        send_error('PASSWORD_TOO_SHORT', 'The new password must be at least 6 characters long.', 400);
    }

    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$user['id']]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($currentPassword, $row['password_hash'])) {
        send_error('CURRENT_PASSWORD_INVALID', 'The current password is incorrect.', 401);
    }

    $hash = password_hash($newPassword, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
    $stmt->execute([$hash, $user['id']]);

    send_json(['ok' => true]);
}

send_error('METHOD_NOT_ALLOWED', 'This method is not allowed.', 405);
