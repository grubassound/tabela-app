<?php
require_once __DIR__ . '/../includes/bootstrap.php';
require_method('PUT');
$user = require_role('admin', 'editor');

$body = json_body();
$rowId = $body['rowId'] ?? null;
$columnId = $body['columnId'] ?? null;
$value = $body['value'] ?? '';

if (!$rowId || !$columnId) {
    send_json(['error' => 'Brak danych'], 400);
}

$stmt = $pdo->prepare('SELECT * FROM `columns` WHERE id = ?');
$stmt->execute([$columnId]);
$column = $stmt->fetch();
if (!$column) {
    send_json(['error' => 'Nie znaleziono kolumny'], 404);
}

if ($column['type'] === 'number' && $value !== '' && !is_numeric(str_replace(',', '.', $value))) {
    send_json(['error' => 'Ta kolumna wymaga wartości liczbowej'], 400);
}

if ($column['type'] === 'select' && $value !== '') {
    $options = parse_options($column['options']);
    if (!in_array($value, $options, true)) {
        send_json(['error' => 'Wybrana wartość nie jest jedną z dozwolonych opcji'], 400);
    }
}

$check = $pdo->prepare('SELECT 1 FROM cells WHERE row_id = ? AND column_id = ?');
$check->execute([$rowId, $columnId]);

if ($check->fetch()) {
    $stmt = $pdo->prepare('UPDATE cells SET value = ?, updated_by = ? WHERE row_id = ? AND column_id = ?');
    $stmt->execute([$value, $user['id'], $rowId, $columnId]);
} else {
    $stmt = $pdo->prepare('INSERT INTO cells (row_id, column_id, value, updated_by) VALUES (?, ?, ?, ?)');
    $stmt->execute([$rowId, $columnId, $value, $user['id']]);
}

send_json(['ok' => true]);
