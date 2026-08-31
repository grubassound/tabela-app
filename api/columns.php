<?php
require_once __DIR__ . '/../includes/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $user = require_role('admin');
    $body = json_body();
    $name = trim($body['name'] ?? '');
    $type = in_array($body['type'] ?? '', ['text', 'number', 'select'], true) ? $body['type'] : 'text';

    if ($name === '') send_json(['error' => 'Podaj nazwę kolumny'], 400);

    $optionsJson = null;
    if ($type === 'select') {
        $clean = sanitize_options_input($body['options'] ?? []);
        if (empty($clean)) send_json(['error' => 'Lista wyboru wymaga co najmniej jednej opcji'], 400);
        $optionsJson = json_encode($clean);
    }

    $maxOrder = $pdo->query('SELECT COALESCE(MAX(order_index), -1) FROM `columns`')->fetchColumn();
    $nextOrder = (int) $maxOrder + 1;

    $stmt = $pdo->prepare('INSERT INTO `columns` (name, type, options, order_index) VALUES (?, ?, ?, ?)');
    $stmt->execute([$name, $type, $optionsJson, $nextOrder]);
    $columnId = (int) $pdo->lastInsertId();

    $rows = $pdo->query('SELECT id FROM `rows`')->fetchAll();
    $insertCell = $pdo->prepare('INSERT INTO cells (row_id, column_id, value, updated_by) VALUES (?, ?, ?, ?)');
    foreach ($rows as $r) {
        $insertCell->execute([$r['id'], $columnId, '', $user['id']]);
    }

    send_json(['id' => $columnId]);
}

if ($method === 'PUT') {
    require_role('admin');
    $id = $_GET['id'] ?? null;
    if (!$id) send_json(['error' => 'Brak id kolumny'], 400);

    $stmt = $pdo->prepare('SELECT * FROM `columns` WHERE id = ?');
    $stmt->execute([$id]);
    $col = $stmt->fetch();
    if (!$col) send_json(['error' => 'Nie znaleziono kolumny'], 404);

    $body = json_body();
    $nextType = in_array($body['type'] ?? '', ['text', 'number', 'select'], true) ? $body['type'] : $col['type'];

    $optionsJson = $col['options'];
    if ($nextType === 'select') {
        $source = array_key_exists('options', $body) ? $body['options'] : parse_options($col['options']);
        $clean = sanitize_options_input($source);
        if (empty($clean)) send_json(['error' => 'Lista wyboru wymaga co najmniej jednej opcji'], 400);
        $optionsJson = json_encode($clean);
    } elseif (isset($body['type']) && $body['type'] !== 'select') {
        $optionsJson = null;
    }

    $nextName = !empty($body['name']) ? trim($body['name']) : $col['name'];
    $nextOrder = $body['order_index'] ?? $col['order_index'];

    $stmt = $pdo->prepare('UPDATE `columns` SET name = ?, type = ?, options = ?, order_index = ? WHERE id = ?');
    $stmt->execute([$nextName, $nextType, $optionsJson, $nextOrder, $id]);

    send_json(['ok' => true]);
}

if ($method === 'DELETE') {
    require_role('admin');
    $id = $_GET['id'] ?? null;
    if (!$id) send_json(['error' => 'Brak id kolumny'], 400);

    $stmt = $pdo->prepare('DELETE FROM `columns` WHERE id = ?');
    $stmt->execute([$id]);
    send_json(['ok' => true]);
}

send_json(['error' => 'Niedozwolona metoda'], 405);
