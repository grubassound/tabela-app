<?php
require_once __DIR__ . '/../includes/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $user = require_role('admin', 'editor');

    $maxOrder = $pdo->query('SELECT COALESCE(MAX(order_index), -1) FROM `rows`')->fetchColumn();
    $nextOrder = (int) $maxOrder + 1;

    $stmt = $pdo->prepare('INSERT INTO `rows` (order_index, created_by) VALUES (?, ?)');
    $stmt->execute([$nextOrder, $user['id']]);
    $rowId = (int) $pdo->lastInsertId();

    $columns = $pdo->query('SELECT id FROM `columns`')->fetchAll();
    $insertCell = $pdo->prepare('INSERT INTO cells (row_id, column_id, value, updated_by) VALUES (?, ?, ?, ?)');
    foreach ($columns as $col) {
        $insertCell->execute([$rowId, $col['id'], '', $user['id']]);
    }

    send_json(['id' => $rowId]);
}

if ($method === 'DELETE') {
    require_role('admin', 'editor');
    $id = $_GET['id'] ?? null;
    if (!$id) send_json(['error' => 'Brak id wiersza'], 400);

    $stmt = $pdo->prepare('DELETE FROM `rows` WHERE id = ?');
    $stmt->execute([$id]);
    send_json(['ok' => true]);
}

send_json(['error' => 'Niedozwolona metoda'], 405);
