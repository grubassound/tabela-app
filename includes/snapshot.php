<?php
/**
 * Budowanie danych tabeli oraz archiwizowanie migawek.
 * Właściwe, codzienne tworzenie migawki o stałej porze wykonuje cli/daily_archive.php przez cron.
 */

function build_table_data(PDO $pdo): array {
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
        $cellMap[$c['row_id']][$c['column_id']] = [
            'value' => $c['value'],
            'isLine' => (bool) $c['is_line'],
        ];
    }

    $data = array_map(function ($r) use ($columns, $cellMap) {
        $rowCells = [];
        foreach ($columns as $col) {
            $rowCells[(string) $col['id']] = $cellMap[$r['id']][$col['id']] ?? ['value' => '', 'isLine' => false];
        }
        return [
            'id' => (int) $r['id'],
            'isDivider' => (bool) $r['is_divider'],
            'cells' => $rowCells,
        ];
    }, $rows);

    return ['columns' => $columns, 'rows' => $data];
}

function create_or_replace_daily_archive(PDO $pdo, ?string $date = null): void {
    $date = $date ?? date('Y-m-d');

    $data = build_table_data($pdo);
    $stmt = $pdo->prepare('
        INSERT INTO archives (snapshot_date, row_count, data) VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE row_count = VALUES(row_count), data = VALUES(data)
    ');
    $stmt->execute([$date, count($data['rows']), json_encode($data)]);
}
