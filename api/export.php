<?php
require_once __DIR__ . '/../includes/bootstrap.php';
require_method('GET');

$user = current_user();
$publicView = get_setting($pdo, 'public_view', '0') === '1';
if (!$user && !$publicView) {
    send_error('AUTH_REQUIRED', 'You are not logged in.', 401);
}

$data = build_table_data($pdo);
$tableName = get_setting($pdo, 'table_name', '') ?: 'table';
$filenameBase = trim(preg_replace('/[^a-zA-Z0-9_\-]+/', '_', $tableName), '_') ?: 'table';

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $filenameBase . '-' . date('Y-m-d') . '.csv"');

echo "\xEF\xBB\xBF";

$out = fopen('php://output', 'w');
fputcsv($out, array_map(fn($c) => $c['name'], $data['columns']), ';');

foreach ($data['rows'] as $row) {
    if ($row['isDivider']) {
        fputcsv($out, array_fill(0, count($data['columns']), ''), ';');
        continue;
    }
    $line = [];
    foreach ($data['columns'] as $col) {
        $cell = $row['cells'][(string) $col['id']];
        $line[] = $cell['isLine'] ? '' : $cell['value'];
    }
    fputcsv($out, $line, ';');
}
fclose($out);
exit;
