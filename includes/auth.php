<?php
/** Funkcje pomocnicze: sesje, autoryzacja, JSON. */

function json_body(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function send_json($data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

function current_user(): ?array {
    return $_SESSION['user'] ?? null;
}

function require_auth(): array {
    $user = current_user();
    if (!$user) {
        send_json(['error' => 'Niezalogowany'], 401);
    }
    return $user;
}

function require_role(string ...$roles): array {
    $user = require_auth();
    if (!in_array($user['role'], $roles, true)) {
        send_json(['error' => 'Brak uprawnień'], 403);
    }
    return $user;
}

function require_method(string ...$methods): void {
    if (!in_array($_SERVER['REQUEST_METHOD'], $methods, true)) {
        send_json(['error' => 'Niedozwolona metoda'], 405);
    }
}

function parse_options($raw): array {
    if (!$raw) return [];
    $arr = json_decode($raw, true);
    if (!is_array($arr)) return [];
    return array_values(array_filter($arr, fn($o) => is_string($o) && trim($o) !== ''));
}

function sanitize_options_input($options): array {
    if (!is_array($options)) return [];
    $cleaned = array_map(fn($o) => trim((string) $o), $options);
    $cleaned = array_filter($cleaned, fn($o) => $o !== '');
    return array_values(array_unique($cleaned));
}
