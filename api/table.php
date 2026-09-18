<?php
require_once __DIR__ . '/../includes/bootstrap.php';
require_method('GET');
$user = current_user();
$publicView = get_setting($pdo, 'public_view', '0') === '1';
if (!$user && !$publicView) {
    send_error('AUTH_REQUIRED', 'You are not logged in.', 401);
}
$role = $user['role'] ?? 'viewer';

$data = build_table_data($pdo);
$tableName = get_setting($pdo, 'table_name', '');
send_json(['columns' => $data['columns'], 'rows' => $data['rows'], 'role' => $role, 'tableName' => $tableName]);
