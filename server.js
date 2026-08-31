const express = require('express');
const session = require('express-session');
const SqliteStore = require('better-sqlite3-session-store')(session);
const bcrypt = require('bcryptjs');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(session({
  store: new SqliteStore({
    client: db,
    expired: { clear: true, intervalMs: 15 * 60 * 1000 }
  }),
  secret: process.env.SESSION_SECRET || 'zmien-ten-sekret-w-produkcji',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 12, // 12h
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// ---------- Middleware pomocnicze ----------
function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Niezalogowany' });
  next();
}
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user) return res.status(401).json({ error: 'Niezalogowany' });
    if (!roles.includes(req.session.user.role)) {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }
    next();
  };
}
function parseOptions(raw) {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter(o => typeof o === 'string' && o.trim() !== '') : [];
  } catch {
    return [];
  }
}
function sanitizeOptionsInput(options) {
  if (!Array.isArray(options)) return [];
  const cleaned = options.map(o => String(o).trim()).filter(o => o !== '');
  return [...new Set(cleaned)]; // usuń duplikaty
}

// ---------- Autoryzacja ----------
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Podaj login i hasło' });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
  }
  req.session.user = { id: user.id, username: user.username, role: user.role };
  res.json({ user: req.session.user });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

app.put('/api/me/password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Podaj obecne i nowe hasło' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Nowe hasło musi mieć co najmniej 6 znaków' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);
  if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: 'Obecne hasło jest nieprawidłowe' });
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, user.id);
  res.json({ ok: true });
});

// ---------- Tabela: kolumny + wiersze + komórki ----------
app.get('/api/table', requireAuth, (req, res) => {
  const columns = db.prepare('SELECT * FROM columns ORDER BY order_index ASC, id ASC').all()
    .map(col => ({ ...col, options: col.type === 'select' ? parseOptions(col.options) : undefined }));
  const rows = db.prepare('SELECT * FROM rows ORDER BY order_index ASC, id ASC').all();
  const cells = db.prepare('SELECT * FROM cells').all();

  const cellMap = {};
  for (const c of cells) {
    if (!cellMap[c.row_id]) cellMap[c.row_id] = {};
    cellMap[c.row_id][c.column_id] = c.value;
  }

  const data = rows.map(r => ({
    id: r.id,
    cells: Object.fromEntries(columns.map(col => [col.id, (cellMap[r.id] && cellMap[r.id][col.id]) || '']))
  }));

  res.json({ columns, rows: data, role: req.session.user.role });
});

// ---------- Wiersze (editor + admin) ----------
app.post('/api/rows', requireRole('admin', 'editor'), (req, res) => {
  const maxOrder = db.prepare('SELECT COALESCE(MAX(order_index), -1) AS m FROM rows').get().m;
  const info = db.prepare('INSERT INTO rows (order_index, created_by) VALUES (?, ?)')
    .run(maxOrder + 1, req.session.user.id);
  const columns = db.prepare('SELECT id FROM columns').all();
  const insertCell = db.prepare('INSERT INTO cells (row_id, column_id, value, updated_by) VALUES (?, ?, ?, ?)');
  for (const col of columns) insertCell.run(info.lastInsertRowid, col.id, '', req.session.user.id);
  res.json({ id: info.lastInsertRowid });
});

app.delete('/api/rows/:id', requireRole('admin', 'editor'), (req, res) => {
  db.prepare('DELETE FROM rows WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Komórki (editor + admin) ----------
app.put('/api/cells', requireRole('admin', 'editor'), (req, res) => {
  const { rowId, columnId, value } = req.body || {};
  if (!rowId || !columnId) return res.status(400).json({ error: 'Brak danych' });

  const column = db.prepare('SELECT * FROM columns WHERE id = ?').get(columnId);
  if (!column) return res.status(404).json({ error: 'Nie znaleziono kolumny' });

  if (column.type === 'number' && value !== '' && isNaN(Number(value.replace(',', '.')))) {
    return res.status(400).json({ error: 'Ta kolumna wymaga wartości liczbowej' });
  }

  if (column.type === 'select' && value !== '') {
    const options = parseOptions(column.options);
    if (!options.includes(value)) {
      return res.status(400).json({ error: 'Wybrana wartość nie jest jedną z dozwolonych opcji' });
    }
  }

  const exists = db.prepare('SELECT 1 FROM cells WHERE row_id = ? AND column_id = ?').get(rowId, columnId);
  if (exists) {
    db.prepare('UPDATE cells SET value = ?, updated_by = ?, updated_at = datetime(\'now\') WHERE row_id = ? AND column_id = ?')
      .run(value, req.session.user.id, rowId, columnId);
  } else {
    db.prepare('INSERT INTO cells (row_id, column_id, value, updated_by) VALUES (?, ?, ?, ?)')
      .run(rowId, columnId, value, req.session.user.id);
  }
  res.json({ ok: true });
});

// ---------- Kolumny (tylko admin) ----------
app.post('/api/columns', requireRole('admin'), (req, res) => {
  const { name, type, options } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Podaj nazwę kolumny' });
  const colType = ['text', 'number', 'select'].includes(type) ? type : 'text';

  let optionsJson = null;
  if (colType === 'select') {
    const cleanOptions = sanitizeOptionsInput(options);
    if (cleanOptions.length === 0) {
      return res.status(400).json({ error: 'Lista wyboru wymaga co najmniej jednej opcji' });
    }
    optionsJson = JSON.stringify(cleanOptions);
  }

  const maxOrder = db.prepare('SELECT COALESCE(MAX(order_index), -1) AS m FROM columns').get().m;
  const info = db.prepare('INSERT INTO columns (name, type, options, order_index) VALUES (?, ?, ?, ?)')
    .run(name, colType, optionsJson, maxOrder + 1);

  // Dodaj puste komórki dla istniejących wierszy
  const rows = db.prepare('SELECT id FROM rows').all();
  const insertCell = db.prepare('INSERT INTO cells (row_id, column_id, value, updated_by) VALUES (?, ?, ?, ?)');
  for (const r of rows) insertCell.run(r.id, info.lastInsertRowid, '', req.session.user.id);

  res.json({ id: info.lastInsertRowid });
});

app.put('/api/columns/:id', requireRole('admin'), (req, res) => {
  const { name, type, options, order_index } = req.body || {};
  const col = db.prepare('SELECT * FROM columns WHERE id = ?').get(req.params.id);
  if (!col) return res.status(404).json({ error: 'Nie znaleziono kolumny' });

  const nextType = type && ['text', 'number', 'select'].includes(type) ? type : col.type;
  let optionsJson = col.options;
  if (nextType === 'select') {
    const source = options !== undefined ? options : parseOptions(col.options);
    const cleanOptions = sanitizeOptionsInput(source);
    if (cleanOptions.length === 0) {
      return res.status(400).json({ error: 'Lista wyboru wymaga co najmniej jednej opcji' });
    }
    optionsJson = JSON.stringify(cleanOptions);
  } else if (type && type !== 'select') {
    optionsJson = null; // porzuć opcje, jeśli zmieniono typ na inny niż lista wyboru
  }

  db.prepare('UPDATE columns SET name = COALESCE(?, name), type = ?, options = ?, order_index = COALESCE(?, order_index) WHERE id = ?')
    .run(name, nextType, optionsJson, order_index, req.params.id);
  res.json({ ok: true });
});

app.delete('/api/columns/:id', requireRole('admin'), (req, res) => {
  db.prepare('DELETE FROM columns WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Użytkownicy (tylko admin) ----------
app.get('/api/users', requireRole('admin'), (req, res) => {
  const users = db.prepare('SELECT id, username, role, created_at FROM users ORDER BY id ASC').all();
  res.json({ users });
});

app.post('/api/users', requireRole('admin'), (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password || !['admin', 'editor', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'Nieprawidłowe dane' });
  }
  const hash = bcrypt.hashSync(password, 10);
  try {
    const info = db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
      .run(username, hash, role);
    res.json({ id: info.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: 'Login już istnieje' });
  }
});

app.put('/api/users/:id', requireRole('admin'), (req, res) => {
  const { password, role } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Nie znaleziono użytkownika' });

  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, req.params.id);
  }
  if (role && ['admin', 'editor', 'viewer'].includes(role)) {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  }
  res.json({ ok: true });
});

app.delete('/api/users/:id', requireRole('admin'), (req, res) => {
  if (Number(req.params.id) === req.session.user.id) {
    return res.status(400).json({ error: 'Nie możesz usunąć własnego konta' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ---------- Pliki statyczne ----------
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT} — http://localhost:${PORT}`);
});
