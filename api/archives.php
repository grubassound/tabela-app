<?php
require_once __DIR__ . '/../includes/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    require_role('admin');

    if (isset($_GET['date'])) {
        $stmt = $pdo->prepare('SELECT * FROM archives WHERE snapshot_date = ?');
        $stmt->execute([$_GET['date']]);
        $archive = $stmt->fetch();
        if (!$archive) send_error('ARCHIVE_NOT_FOUND', 'Archive not found.', 404);

        $data = json_decode($archive['data'], true);
        if (!is_array($data)) $data = ['columns' => [], 'rows' => []];

        send_json([
            'date' => $archive['snapshot_date'],
            'columns' => $data['columns'] ?? [],
            'rows' => $data['rows'] ?? [],
        ]);
    }

    $archivesRaw = $pdo->query('SELECT id, snapshot_date, row_count, created_at FROM archives ORDER BY snapshot_date DESC')->fetchAll();
    $archives = array_map(fn($a) => [
        'id' => (int) $a['id'],
        'date' => $a['snapshot_date'],
        'rowCount' => (int) $a['row_count'],
        'createdAt' => $a['created_at'],
    ], $archivesRaw);

    send_json(['archives' => $archives]);
}

if ($method === 'DELETE') {
    require_role('admin');
    $id = $_GET['id'] ?? null;
    if (!$id) send_error('ARCHIVE_ID_REQUIRED', 'Missing archive id.', 400);

    $stmt = $pdo->prepare('DELETE FROM archives WHERE id = ?');
    $stmt->execute([$id]);
    send_json(['ok' => true]);
}

send_error('METHOD_NOT_ALLOWED', 'This method is not allowed.', 405);
