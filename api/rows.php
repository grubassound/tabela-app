<?php
require_once __DIR__ . '/../includes/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $user = require_role('admin', 'editor');
    $body = json_body();
    $isDivider = !empty($body['divider']);

    $maxOrder = $pdo->query('SELECT COALESCE(MAX(order_index), -1) FROM `rows`')->fetchColumn();
    $nextOrder = (int) $maxOrder + 1;

    $stmt = $pdo->prepare('INSERT INTO `rows` (order_index, created_by, is_divider) VALUES (?, ?, ?)');
    $stmt->execute([$nextOrder, $user['id'], $isDivider ? 1 : 0]);
    $rowId = (int) $pdo->lastInsertId();

    $columns = $pdo->query('SELECT id FROM `columns`')->fetchAll();
    $insertCell = $pdo->prepare('INSERT INTO cells (row_id, column_id, value, updated_by) VALUES (?, ?, ?, ?)');
    foreach ($columns as $col) {
        $insertCell->execute([$rowId, $col['id'], '', $user['id']]);
    }

    send_json(['id' => $rowId]);
}

if ($method === 'PUT') {
    require_role('admin', 'editor');
    $body = json_body();
    $order = $body['order'] ?? null;

    if (!is_array($order) || $order === [] || array_filter($order, fn($id) => !is_int($id)) !== []) {
        send_error('INVALID_ORDER', 'Invalid row order.', 400);
    }

    // Kolejność musi obejmować dokładnie wszystkie istniejące wiersze — inaczej ktoś w międzyczasie zmienił tabelę
    $existing = array_map('intval', $pdo->query('SELECT id FROM `rows`')->fetchAll(PDO::FETCH_COLUMN));
    $sortedOrder = $order;
    sort($existing);
    sort($sortedOrder);
    if ($existing !== $sortedOrder) {
        send_error('ROWS_CHANGED', 'The table was changed in the meantime. Please try again.', 409);
    }

    $pdo->beginTransaction();
    $stmt = $pdo->prepare('UPDATE `rows` SET order_index = ? WHERE id = ?');
    foreach ($order as $index => $id) {
        $stmt->execute([$index, $id]);
    }
    $pdo->commit();

    send_json(['ok' => true]);
}

if ($method === 'DELETE') {
    require_role('admin', 'editor');
    $id = $_GET['id'] ?? null;
    if (!$id) send_error('ROW_ID_REQUIRED', 'Missing row id.', 400);

    $stmt = $pdo->prepare('DELETE FROM `rows` WHERE id = ?');
    $stmt->execute([$id]);
    send_json(['ok' => true]);
}

send_error('METHOD_NOT_ALLOWED', 'This method is not allowed.', 405);
