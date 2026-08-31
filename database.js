const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const db = new Database(path.join(__dirname, 'data.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','editor','viewer')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS columns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK(type IN ('text','number','select')),
  options TEXT DEFAULT NULL,
  order_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS rows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cells (
  row_id INTEGER NOT NULL,
  column_id INTEGER NOT NULL,
  value TEXT DEFAULT '',
  updated_by INTEGER,
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (row_id, column_id),
  FOREIGN KEY (row_id) REFERENCES rows(id) ON DELETE CASCADE,
  FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
);
`);

// Migracja: dodaj kolumnę "options" jeśli baza powstała przed wprowadzeniem list wyboru
const columnsInfo = db.prepare("PRAGMA table_info(columns)").all();
if (!columnsInfo.some(c => c.name === 'options')) {
  db.exec("ALTER TABLE columns ADD COLUMN options TEXT DEFAULT NULL");
}

// Domyślny administrator (tworzony tylko raz, jeśli baza jest pusta)
const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
if (userCount === 0) {
  const hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
    .run('admin', hash, 'admin');
  console.log('Utworzono domyślnego administratora: admin / admin123 (ZMIEŃ HASŁO PO PIERWSZYM LOGOWANIU!)');
}

// Domyślne kolumny startowe, jeśli tabela jest pusta
const colCount = db.prepare('SELECT COUNT(*) AS c FROM columns').get().c;
if (colCount === 0) {
  const insertCol = db.prepare('INSERT INTO columns (name, type, order_index) VALUES (?, ?, ?)');
  insertCol.run('Nazwa', 'text', 0);
  insertCol.run('Wartość', 'number', 1);
}

module.exports = db;
