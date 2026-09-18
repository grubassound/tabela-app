<?php
/**
 * Uruchamiane codziennie przez cron o 20:00 — zapisuje migawkę bieżącej tabeli.
 * Użycie: php cli/daily_archive.php
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('Dostęp tylko z linii poleceń.');
}

require_once __DIR__ . '/../includes/db.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/snapshot.php';

$pdo = get_pdo();
ensure_schema($pdo);
create_or_replace_daily_archive($pdo);

echo '[' . date('Y-m-d H:i:s') . "] Zapisano migawkę archiwum na dzień " . date('Y-m-d') . PHP_EOL;
