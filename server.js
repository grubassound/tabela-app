require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcryptjs');
const path = require('path');
const { pool, init } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

const sessionStore = new MySQLStore({
  createDatabaseTable: true,
  schema: {
    tableName: 'sessions',
    columnNames: { session_id: 'session_id', expires: 'expires', data: 'data' }
  }
}, pool);

app.use(session({
  store: sessionStore,
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
function asyncRoute(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}

// ---------- Autoryzacja ----------
app.post('/api/login', asyncRoute(async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Podaj login i hasło' });

  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Nieprawidłowy login lub hasło' });
  }
  req.session.user = { id: user.id, username: user.username, role: user.role };
  res.json({ user: req.session.user });
}));

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

app.put('/api/me/password', requireAuth, asyncRoute(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Podaj obecne i nowe hasło' });
  if (newPassword.length < 6) return res.status(400).json({ error: 'Nowe hasło musi mieć co najmniej 6 znaków' });

  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
  const user = rows[0];
  if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
    return res.status(401).json({ error: 'Obecne hasło jest nieprawidłowe' });
  }
  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user.id]);
  res.json({ ok: true });
}));

// ---------- Tabela: kolumny + wiersze + komórki ----------
app.get('/api/table', requireAuth, asyncRoute(async (req, res) => {
  const [columnRows] = await pool.query('SELECT * FROM `columns` ORDER BY order_index ASC, id ASC');
  const columns = columnRows.map(col => ({ ...col, options: col.type === 'select' ? parseOptions(col.options) : undefined }));

  const [rowRows] = await pool.query('SELECT * FROM `rows` ORDER BY order_index ASC, id ASC');
  const [cellRows] = await pool.query('SELECT * FROM cells');

  const cellMap = {};
  for (const c of cellRows) {
    if (!cellMap[c.row_id]) cellMap[c.row_id] = {};
    cellMap[c.row_id][c.column_id] = c.value;
  }

  const data = rowRows.map(r => ({
    id: r.id,
    cells: Object.fromEntries(columns.map(col => [col.id, (cellMap[r.id] && cellMap[r.id][col.id]) || '']))
  }));

  res.json({ columns, rows: data, role: req.session.user.role });
}));

// ---------- Wiersze (editor + admin) ----------
app.post('/api/rows', requireRole('admin', 'editor'), asyncRoute(async (req, res) => {
  const [maxRows] = await pool.query('SELECT COALESCE(MAX(order_index), -1) AS m FROM `rows`');
  const nextOrder = maxRows[0].m + 1;
  const [result] = await pool.query('INSERT INTO `rows` (order_index, created_by) VALUES (?, ?)', [nextOrder, req.session.user.id]);
  const rowId = result.insertId;

  const [columns] = await pool.query('SELECT id FROM `columns`');
  for (const col of columns) {
    await pool.query('INSERT INTO cells (row_id, column_id, value, updated_by) VALUES (?, ?, ?, ?)', [rowId, col.id, '', req.session.user.id]);
  }
  res.json({ id: rowId });
}));

app.delete('/api/rows/:id', requireRole('admin', 'editor'), asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM `rows` WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

// ---------- Komórki (editor + admin) ----------
app.put('/api/cells', requireRole('admin', 'editor'), asyncRoute(async (req, res) => {
  const { rowId, columnId, value } = req.body || {};
  if (!rowId || !columnId) return res.status(400).json({ error: 'Brak danych' });

  const [colRows] = await pool.query('SELECT * FROM `columns` WHERE id = ?', [columnId]);
  const column = colRows[0];
  if (!column) return res.status(404).json({ error: 'Nie znaleziono kolumny' });

  if (column.type === 'number' && value !== '' && isNaN(Number(String(value).replace(',', '.')))) {
    return res.status(400).json({ error: 'Ta kolumna wymaga wartości liczbowej' });
  }

  if (column.type === 'select' && value !== '') {
    const options = parseOptions(column.options);
    if (!options.includes(value)) {
      return res.status(400).json({ error: 'Wybrana wartość nie jest jedną z dozwolonych opcji' });
    }
  }

  const [existing] = await pool.query('SELECT 1 FROM cells WHERE row_id = ? AND column_id = ?', [rowId, columnId]);
  if (existing.length > 0) {
    await pool.query('UPDATE cells SET value = ?, updated_by = ? WHERE row_id = ? AND column_id = ?', [value, req.session.user.id, rowId, columnId]);
  } else {
    await pool.query('INSERT INTO cells (row_id, column_id, value, updated_by) VALUES (?, ?, ?, ?)', [rowId, columnId, value, req.session.user.id]);
  }
  res.json({ ok: true });
}));

// ---------- Kolumny (tylko admin) ----------
app.post('/api/columns', requireRole('admin'), asyncRoute(async (req, res) => {
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

  const [maxRows] = await pool.query('SELECT COALESCE(MAX(order_index), -1) AS m FROM `columns`');
  const nextOrder = maxRows[0].m + 1;
  const [result] = await pool.query('INSERT INTO `columns` (name, type, options, order_index) VALUES (?, ?, ?, ?)', [name, colType, optionsJson, nextOrder]);
  const columnId = result.insertId;

  const [rows] = await pool.query('SELECT id FROM `rows`');
  for (const r of rows) {
    await pool.query('INSERT INTO cells (row_id, column_id, value, updated_by) VALUES (?, ?, ?, ?)', [r.id, columnId, '', req.session.user.id]);
  }

  res.json({ id: columnId });
}));

app.put('/api/columns/:id', requireRole('admin'), asyncRoute(async (req, res) => {
  const { name, type, options, order_index } = req.body || {};
  const [colRows] = await pool.query('SELECT * FROM `columns` WHERE id = ?', [req.params.id]);
  const col = colRows[0];
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
    optionsJson = null;
  }

  const nextName = name !== undefined && name !== '' ? name : col.name;
  const nextOrder = order_index !== undefined ? order_index : col.order_index;

  await pool.query('UPDATE `columns` SET name = ?, type = ?, options = ?, order_index = ? WHERE id = ?', [nextName, nextType, optionsJson, nextOrder, req.params.id]);
  res.json({ ok: true });
}));

app.delete('/api/columns/:id', requireRole('admin'), asyncRoute(async (req, res) => {
  await pool.query('DELETE FROM `columns` WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

// ---------- Użytkownicy (tylko admin) ----------
app.get('/api/users', requireRole('admin'), asyncRoute(async (req, res) => {
  const [users] = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY id ASC');
  res.json({ users });
}));

app.post('/api/users', requireRole('admin'), asyncRoute(async (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password || !['admin', 'editor', 'viewer'].includes(role)) {
    return res.status(400).json({ error: 'Nieprawidłowe dane' });
  }
  const hash = await bcrypt.hash(password, 10);
  try {
    const [result] = await pool.query('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [username, hash, role]);
    res.json({ id: result.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Login już istnieje' });
    throw e;
  }
}));

app.put('/api/users/:id', requireRole('admin'), asyncRoute(async (req, res) => {
  const { password, role } = req.body || {};
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'Nie znaleziono użytkownika' });

  if (password) {
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.params.id]);
  }
  if (role && ['admin', 'editor', 'viewer'].includes(role)) {
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
  }
  res.json({ ok: true });
}));

app.delete('/api/users/:id', requireRole('admin'), asyncRoute(async (req, res) => {
  if (Number(req.params.id) === req.session.user.id) {
    return res.status(400).json({ error: 'Nie możesz usunąć własnego konta' });
  }
  await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

// ---------- Pliki statyczne ----------
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Obsługa błędów ----------
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
});

init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Serwer działa na porcie ${PORT} — http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('Nie udało się zainicjalizować bazy danych:', err);
    process.exit(1);
  });
