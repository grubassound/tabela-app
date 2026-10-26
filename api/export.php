<?php
require_once __DIR__ . '/../includes/bootstrap.php';
require_method('GET');

$user = current_user();
$publicView = get_setting($pdo, 'public_view', '0') === '1';
if (!$user && !$publicView) {
    send_error('AUTH_REQUIRED', 'You are not logged in.', 401);
}

// Excel traktuje wartości zaczynające się od = + - @ (oraz tab/CR) jako formuły — neutralizujemy je.
// Zwykłe liczby (np. -5 lub -3,5) zostawiamy bez zmian.
function csv_safe(string $value): string {
    if ($value === '' || is_numeric(str_replace(',', '.', $value))) return $value;
    return in_array($value[0], ['=', '+', '-', '@', "\t", "\r"], true) ? "'" . $value : $value;
}

$data = build_table_data($pdo);
$tableName = get_setting($pdo, 'table_name', '') ?: 'table';
$filenameBase = trim(preg_replace('/[^a-zA-Z0-9_\-]+/', '_', $tableName), '_') ?: 'table';

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="' . $filenameBase . '-' . date('Y-m-d') . '.csv"');

echo "\xEF\xBB\xBF";

$out = fopen('php://output', 'w');
fputcsv($out, array_map(fn($c) => csv_safe($c['name']), $data['columns']), ';');

foreach ($data['rows'] as $row) {
    if ($row['isDivider']) {
        fputcsv($out, array_fill(0, count($data['columns']), ''), ';');
        continue;
    }
    $line = [];
    foreach ($data['columns'] as $col) {
        $cell = $row['cells'][(string) $col['id']];
        $line[] = $cell['isLine'] ? '' : csv_safe((string) $cell['value']);
    }
    fputcsv($out, $line, ';');
}
fclose($out);
exit;
