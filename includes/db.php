<?php
/**
 * Połączenie z bazą (PDO) oraz zapewnienie, że wszystkie tabele istnieją
 * (tworzone automatycznie przy pierwszym żądaniu, jeśli jeszcze ich nie ma).
 */

require_once __DIR__ . '/../config.php';

function get_pdo(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    try {
        $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASSWORD, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Błąd połączenia z bazą danych. Sprawdź config.php.']);
        exit;
    }
    return $pdo;
}

function ensure_schema(PDO $pdo): void {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(191) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('admin','editor','viewer') NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `columns` (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(191) NOT NULL,
            type ENUM('text','number','select') NOT NULL DEFAULT 'text',
            options TEXT DEFAULT NULL,
            order_index INT NOT NULL DEFAULT 0
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `rows` (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_index INT NOT NULL DEFAULT 0,
            created_by INT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS cells (
            row_id INT NOT NULL,
            column_id INT NOT NULL,
            value TEXT,
            updated_by INT DEFAULT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (row_id, column_id),
            FOREIGN KEY (row_id) REFERENCES `rows`(id) ON DELETE CASCADE,
            FOREIGN KEY (column_id) REFERENCES `columns`(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Domyślny administrator (tworzony tylko raz, jeśli tabela users jest pusta)
    $count = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
    if ($count === 0) {
        $hash = password_hash('admin123', PASSWORD_BCRYPT);
        $stmt = $pdo->prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)');
        $stmt->execute(['admin', $hash, 'admin']);
    }

    // Domyślne kolumny startowe, jeśli tabela columns jest pusta
    $colCount = (int) $pdo->query('SELECT COUNT(*) FROM `columns`')->fetchColumn();
    if ($colCount === 0) {
        $stmt = $pdo->prepare('INSERT INTO `columns` (name, type, order_index) VALUES (?, ?, ?)');
        $stmt->execute(['Nazwa', 'text', 0]);
        $stmt->execute(['Wartość', 'number', 1]);
    }
}
