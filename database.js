require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4_unicode_ci'
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(191) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin','editor','viewer') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`columns\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      type ENUM('text','number','select') NOT NULL DEFAULT 'text',
      options TEXT DEFAULT NULL,
      order_index INT NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`rows\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_index INT NOT NULL DEFAULT 0,
      created_by INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cells (
      row_id INT NOT NULL,
      column_id INT NOT NULL,
      value TEXT,
      updated_by INT DEFAULT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (row_id, column_id),
      FOREIGN KEY (row_id) REFERENCES \`rows\`(id) ON DELETE CASCADE,
      FOREIGN KEY (column_id) REFERENCES \`columns\`(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  // Domyślny administrator (tworzony tylko raz, jeśli tabela users jest pusta)
  const [userCountRows] = await pool.query('SELECT COUNT(*) AS c FROM users');
  if (userCountRows[0].c === 0) {
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['admin', hash, 'admin']);
    console.log('Utworzono domyślnego administratora: admin / admin123 (ZMIEŃ HASŁO PO PIERWSZYM LOGOWANIU!)');
  }

  // Domyślne kolumny startowe, jeśli tabela columns jest pusta
  const [colCountRows] = await pool.query('SELECT COUNT(*) AS c FROM `columns`');
  if (colCountRows[0].c === 0) {
    await pool.query('INSERT INTO `columns` (name, type, order_index) VALUES (?, ?, ?)', ['Nazwa', 'text', 0]);
    await pool.query('INSERT INTO `columns` (name, type, order_index) VALUES (?, ?, ?)', ['Wartość', 'number', 1]);
  }
}

module.exports = { pool, init };
