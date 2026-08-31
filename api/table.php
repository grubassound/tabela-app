<?php
require_once __DIR__ . '/../includes/bootstrap.php';
require_method('GET');
$user = require_auth();

$columnsRaw = $pdo->query('SELECT * FROM `columns` ORDER BY order_index ASC, id ASC')->fetchAll();
$columns = array_map(function ($col) {
    if ($col['type'] === 'select') {
        $col['options'] = parse_options($col['options']);
    } else {
        unset($col['options']);
    }
    $col['id'] = (int) $col['id'];
    $col['order_index'] = (int) $col['order_index'];
    return $col;
}, $columnsRaw);

$rows = $pdo->query('SELECT * FROM `rows` ORDER BY order_index ASC, id ASC')->fetchAll();
$cells = $pdo->query('SELECT * FROM cells')->fetchAll();

$cellMap = [];
foreach ($cells as $c) {
    $cellMap[$c['row_id']][$c['column_id']] = $c['value'];
}

$data = array_map(function ($r) use ($columns, $cellMap) {
    $rowCells = [];
    foreach ($columns as $col) {
        $rowCells[(string) $col['id']] = $cellMap[$r['id']][$col['id']] ?? '';
    }
    return ['id' => (int) $r['id'], 'cells' => $rowCells];
}, $rows);

send_json(['columns' => $columns, 'rows' => $data, 'role' => $user['role']]);
