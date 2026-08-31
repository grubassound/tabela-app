const roleLabels = { admin: 'Administrator', editor: 'Edytor', viewer: 'Przeglądający' };
const typeLabels = { text: 'Tekst', number: 'Liczba', select: 'Lista wyboru' };

async function init() {
  const meRes = await fetch('api/me.php');
  const me = await meRes.json();
  if (!me.user) { window.location.href = 'login.html'; return; }
  if (me.user.role !== 'admin') { window.location.href = 'index.html'; return; }
  document.getElementById('usernameLabel').textContent = me.user.username;

  await loadColumns();
  await loadUsers();
}

async function loadColumns() {
  const res = await fetch('api/table.php');
  const data = await res.json();
  const list = document.getElementById('columnsList');
  list.innerHTML = '';
  data.columns.forEach(col => {
    const row = document.createElement('div');
    row.className = 'list-row';
    row.style.flexWrap = 'wrap';

    const meta = col.type === 'select'
      ? `Lista wyboru — ${(col.options || []).join(', ') || 'brak opcji'}`
      : typeLabels[col.type];

    row.innerHTML = `
      <div class="list-row__main">
        <div class="list-row__name">${escapeHtml(col.name)}</div>
        <div class="list-row__meta">${escapeHtml(meta)}</div>
      </div>
    `;
    const editBtn = document.createElement('button');
    editBtn.className = 'btn';
    editBtn.textContent = 'Edytuj';
    editBtn.addEventListener('click', () => toggleColumnEdit(col, row));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn--danger';
    delBtn.textContent = 'Usuń';
    delBtn.addEventListener('click', async () => {
      if (!confirm(`Usunąć kolumnę „${col.name}”? Usunie to też wszystkie dane w tej kolumnie.`)) return;
      await fetch(`api/columns.php?id=${col.id}`, { method: 'DELETE' });
      loadColumns();
    });
    row.appendChild(editBtn);
    row.appendChild(delBtn);
    list.appendChild(row);
  });
}

function toggleColumnEdit(col, row) {
  const existing = row.querySelector('.column-edit-form');
  if (existing) { existing.remove(); return; }
  document.querySelectorAll('.column-edit-form').forEach(f => f.remove());

  const form = document.createElement('form');
  form.className = 'inline-form column-edit-form';
  form.style.flexBasis = '100%';
  form.innerHTML = `
    <div class="field">
      <label>Nazwa kolumny</label>
      <input type="text" class="edit-name" value="${escapeAttr(col.name)}" required>
    </div>
    <div class="field">
      <label>Typ</label>
      <select class="edit-type">
        <option value="text" ${col.type === 'text' ? 'selected' : ''}>Tekst</option>
        <option value="number" ${col.type === 'number' ? 'selected' : ''}>Liczba</option>
        <option value="select" ${col.type === 'select' ? 'selected' : ''}>Lista wyboru</option>
      </select>
    </div>
    <div class="field edit-options-field" style="flex-basis:100%; ${col.type === 'select' ? '' : 'display:none;'}">
      <label>Opcje do wyboru (jedna na linię)</label>
      <textarea class="edit-options" rows="3" style="width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:8px; font:inherit; font-size:14px; background:var(--bg);">${(col.options || []).join('\n')}</textarea>
    </div>
    <button type="submit" class="btn btn--primary">Zapisz zmiany</button>
    <button type="button" class="btn edit-cancel">Anuluj</button>
  `;
  row.appendChild(form);

  const typeSelect = form.querySelector('.edit-type');
  const optionsField = form.querySelector('.edit-options-field');
  typeSelect.addEventListener('change', () => {
    optionsField.style.display = typeSelect.value === 'select' ? '' : 'none';
  });
  form.querySelector('.edit-cancel').addEventListener('click', () => form.remove());

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.querySelector('.edit-name').value.trim();
    const type = typeSelect.value;
    const options = form.querySelector('.edit-options').value.split('\n').map(s => s.trim()).filter(Boolean);
    const res = await fetch(`api/columns.php?id=${col.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type, options })
    });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    loadColumns();
  });
}

async function loadUsers() {
  const res = await fetch('api/users.php');
  const data = await res.json();
  const list = document.getElementById('usersList');
  list.innerHTML = '';
  data.users.forEach(u => {
    const row = document.createElement('div');
    row.className = 'list-row';
    row.innerHTML = `
      <div class="list-row__main">
        <div class="list-row__name">${escapeHtml(u.username)}</div>
        <div class="list-row__meta">${roleLabels[u.role]}</div>
      </div>
    `;
    const select = document.createElement('select');
    select.className = 'btn';
    ['viewer', 'editor', 'admin'].forEach(r => {
      const opt = document.createElement('option');
      opt.value = r; opt.textContent = roleLabels[r];
      if (r === u.role) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener('change', async () => {
      await fetch(`api/users.php?id=${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: select.value })
      });
      loadUsers();
    });
    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn--danger';
    delBtn.textContent = 'Usuń';
    delBtn.addEventListener('click', async () => {
      if (!confirm(`Usunąć użytkownika „${u.username}”?`)) return;
      const r = await fetch(`api/users.php?id=${u.id}`, { method: 'DELETE' });
      if (!r.ok) { const d = await r.json(); alert(d.error); return; }
      loadUsers();
    });
    row.appendChild(select);
    row.appendChild(delBtn);
    list.appendChild(row);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

document.getElementById('colType').addEventListener('change', () => {
  const optionsField = document.getElementById('colOptionsField');
  optionsField.style.display = document.getElementById('colType').value === 'select' ? '' : 'none';
});

document.getElementById('addColumnForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('colName').value.trim();
  const type = document.getElementById('colType').value;
  const options = document.getElementById('colOptions').value.split('\n').map(s => s.trim()).filter(Boolean);
  if (!name) return;
  if (type === 'select' && options.length === 0) {
    alert('Podaj co najmniej jedną opcję do wyboru');
    return;
  }
  const res = await fetch('api/columns.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type, options })
  });
  if (!res.ok) { const d = await res.json(); alert(d.error); return; }
  document.getElementById('colName').value = '';
  document.getElementById('colOptions').value = '';
  document.getElementById('colOptionsField').style.display = 'none';
  document.getElementById('colType').value = 'text';
  loadColumns();
});

document.getElementById('addUserForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('userLogin').value.trim();
  const password = document.getElementById('userPassword').value;
  const role = document.getElementById('userRole').value;
  const res = await fetch('api/users.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role })
  });
  if (!res.ok) { const d = await res.json(); alert(d.error); return; }
  document.getElementById('userLogin').value = '';
  document.getElementById('userPassword').value = '';
  loadUsers();
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('api/logout.php', { method: 'POST' });
  window.location.href = 'login.html';
});

init();
