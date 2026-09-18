<?php
require_once __DIR__ . '/../includes/bootstrap.php';
require_method('PUT');
$user = require_role('admin', 'editor');

$body = json_body();
$rowId = $body['rowId'] ?? null;
$columnId = $body['columnId'] ?? null;
$value = $body['value'] ?? '';
$isLine = !empty($body['isLine']);

if (!$rowId || !$columnId) {
    send_error('MISSING_DATA', 'Missing data.', 400);
}

$stmt = $pdo->prepare('SELECT * FROM `columns` WHERE id = ?');
$stmt->execute([$columnId]);
$column = $stmt->fetch();
if (!$column) {
    send_error('COLUMN_NOT_FOUND', 'Column not found.', 404);
}

if ($isLine) {
    $value = '';
} else {
    if ($column['type'] === 'number' && $value !== '' && !is_numeric(str_replace(',', '.', $value))) {
        send_error('VALUE_MUST_BE_NUMBER', 'This column requires a numeric value.', 400);
    }

    if ($column['type'] === 'select' && $value !== '') {
        $options = parse_options($column['options']);
        if (!in_array($value, $options, true)) {
            send_error('VALUE_NOT_ALLOWED', 'The selected value is not one of the allowed options.', 400);
        }
    }
}

$check = $pdo->prepare('SELECT 1 FROM cells WHERE row_id = ? AND column_id = ?');
$check->execute([$rowId, $columnId]);

if ($check->fetch()) {
    $stmt = $pdo->prepare('UPDATE cells SET value = ?, is_line = ?, updated_by = ? WHERE row_id = ? AND column_id = ?');
    $stmt->execute([$value, $isLine ? 1 : 0, $user['id'], $rowId, $columnId]);
} else {
    $stmt = $pdo->prepare('INSERT INTO cells (row_id, column_id, value, is_line, updated_by) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$rowId, $columnId, $value, $isLine ? 1 : 0, $user['id']]);
}

send_json(['ok' => true]);
