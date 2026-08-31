<?php
/** Dołączany na początku każdego pliku w api/ — startuje sesję, łączy z bazą, dba o schemat. */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/auth.php';

session_set_cookie_params([
    'lifetime' => SESSION_LIFETIME,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => SESSION_SECURE_COOKIE,
]);
session_start();

$pdo = get_pdo();
ensure_schema($pdo);
