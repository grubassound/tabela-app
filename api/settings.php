<?php
require_once __DIR__ . '/../includes/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    require_role('admin');
    send_json([
        'publicView' => get_setting($pdo, 'public_view', '0') === '1',
        'tableName' => get_setting($pdo, 'table_name', ''),
    ]);
}

if ($method === 'PUT') {
    require_role('admin');
    $body = json_body();

    if (array_key_exists('publicView', $body)) {
        set_setting($pdo, 'public_view', !empty($body['publicView']) ? '1' : '0');
    }

    if (array_key_exists('tableName', $body)) {
        $tableName = trim((string) $body['tableName']);
        if (iconv_strlen($tableName, 'UTF-8') > 100) {
            send_error('TABLE_NAME_TOO_LONG', 'The table name must be 100 characters or fewer.', 400);
        }
        set_setting($pdo, 'table_name', $tableName);
    }

    send_json(['ok' => true]);
}

send_error('METHOD_NOT_ALLOWED', 'This method is not allowed.', 405);
