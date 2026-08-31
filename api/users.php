<?php
require_once __DIR__ . '/../includes/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    require_role('admin');
    $users = $pdo->query('SELECT id, username, role, created_at FROM users ORDER BY id ASC')->fetchAll();
    $users = array_map(function ($u) {
        $u['id'] = (int) $u['id'];
        return $u;
    }, $users);
    send_json(['users' => $users]);
}

if ($method === 'POST') {
    require_role('admin');
    $body = json_body();
    $username = trim($body['username'] ?? '');
    $password = $body['password'] ?? '';
    $role = $body['role'] ?? '';

    if ($username === '' || $password === '' || !in_array($role, ['admin', 'editor', 'viewer'], true)) {
        send_json(['error' => 'Nieprawidłowe dane'], 400);
    }

    $existing = $pdo->prepare('SELECT 1 FROM users WHERE username = ?');
    $existing->execute([$username]);
    if ($existing->fetch()) {
        send_json(['error' => 'Login już istnieje'], 400);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
    $stmt->execute([$username, $hash, $role]);

    send_json(['id' => (int) $pdo->lastInsertId()]);
}

if ($method === 'PUT') {
    $user = require_role('admin');
    $id = $_GET['id'] ?? null;
    if (!$id) send_json(['error' => 'Brak id użytkownika'], 400);

    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $target = $stmt->fetch();
    if (!$target) send_json(['error' => 'Nie znaleziono użytkownika'], 404);

    $body = json_body();

    if (!empty($body['password'])) {
        $hash = password_hash($body['password'], PASSWORD_BCRYPT);
        $stmt = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $stmt->execute([$hash, $id]);
    }
    if (!empty($body['role']) && in_array($body['role'], ['admin', 'editor', 'viewer'], true)) {
        $stmt = $pdo->prepare('UPDATE users SET role = ? WHERE id = ?');
        $stmt->execute([$body['role'], $id]);
    }

    send_json(['ok' => true]);
}

if ($method === 'DELETE') {
    $user = require_role('admin');
    $id = $_GET['id'] ?? null;
    if (!$id) send_json(['error' => 'Brak id użytkownika'], 400);

    if ((int) $id === (int) $user['id']) {
        send_json(['error' => 'Nie możesz usunąć własnego konta'], 400);
    }

    $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
    $stmt->execute([$id]);
    send_json(['ok' => true]);
}

send_json(['error' => 'Niedozwolona metoda'], 405);
