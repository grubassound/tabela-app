let state = { columns: [], rows: [], role: 'viewer' };

async function init() {
  const meRes = await fetch('/api/me');
  const me = await meRes.json();
  if (!me.user) { window.location.href = '/login.html'; return; }

  document.getElementById('usernameLabel').textContent = me.user.username;
  document.getElementById('rolePill').textContent = roleLabel(me.user.role);
  if (me.user.role === 'admin') document.getElementById('adminLink').style.display = '';
  if (me.user.role === 'admin' || me.user.role === 'editor') {
    document.getElementById('addRowBtn').style.display = '';
  }

  await loadTable();
}

function roleLabel(role) {
  return { admin: 'Administrator', editor: 'Edytor', viewer: 'Przeglądający' }[role] || role;
}

async function loadTable() {
  const res = await fetch('/api/table');
  if (res.status === 401) { window.location.href = '/login.html'; return; }
  state = await res.json();
  render();
}

function render() {
  const canEdit = state.role === 'admin' || state.role === 'editor';
  const headRow = document.getElementById('headRow');
  const bodyRows = document.getElementById('bodyRows');
  const emptyState = document.getElementById('emptyState');

  headRow.innerHTML = '';
  state.columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col.name;
    headRow.appendChild(th);
  });
  if (canEdit) {
    const th = document.createElement('th');
    th.className = 'row-actions-col';
    th.textContent = '';
    headRow.appendChild(th);
  }

  bodyRows.innerHTML = '';
  if (state.rows.length === 0) {
    emptyState.style.display = 'block';
  } else {
    emptyState.style.display = 'none';
  }

  state.rows.forEach(row => {
    const tr = document.createElement('tr');
    state.columns.forEach(col => {
      const td = document.createElement('td');
      const currentValue = row.cells[col.id] || '';

      if (col.type === 'select') {
        const select = document.createElement('select');
        select.className = 'cell';
        const emptyOpt = document.createElement('option');
        emptyOpt.value = '';
        emptyOpt.textContent = '—';
        select.appendChild(emptyOpt);
        (col.options || []).forEach(opt => {
          const optionEl = document.createElement('option');
          optionEl.value = opt;
          optionEl.textContent = opt;
          if (opt === currentValue) optionEl.selected = true;
          select.appendChild(optionEl);
        });
        if (!canEdit) select.setAttribute('disabled', 'disabled');
        select.addEventListener('change', () => saveCell(row.id, col.id, select));
        td.appendChild(select);
      } else {
        const input = document.createElement('input');
        input.className = 'cell';
        input.value = currentValue;
        input.type = 'text';
        input.inputMode = col.type === 'number' ? 'decimal' : 'text';
        if (!canEdit) input.setAttribute('readonly', 'readonly');
        input.addEventListener('change', () => saveCell(row.id, col.id, input));
        td.appendChild(input);
      }
      tr.appendChild(td);
    });
    if (canEdit) {
      const td = document.createElement('td');
      td.className = 'row-actions-col';
      const btn = document.createElement('button');
      btn.className = 'row-del';
      btn.title = 'Usuń wiersz';
      btn.textContent = '✕';
      btn.addEventListener('click', () => deleteRow(row.id));
      td.appendChild(btn);
      tr.appendChild(td);
    }
    bodyRows.appendChild(tr);
  });
}

async function saveCell(rowId, columnId, input) {
  const prevValue = input.dataset.prev !== undefined ? input.dataset.prev : input.value;
  const value = input.value;
  const res = await fetch('/api/cells', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rowId, columnId, value })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    alert(data.error || 'Nie udało się zapisać komórki');
    input.value = prevValue;
    return;
  }
  input.dataset.prev = value;
}

async function deleteRow(rowId) {
  if (!confirm('Usunąć ten wiersz?')) return;
  const res = await fetch(`/api/rows/${rowId}`, { method: 'DELETE' });
  if (!res.ok) { alert('Nie udało się usunąć wiersza'); return; }
  await loadTable();
}

document.getElementById('addRowBtn').addEventListener('click', async () => {
  const res = await fetch('/api/rows', { method: 'POST' });
  if (!res.ok) { alert('Nie udało się dodać wiersza'); return; }
  await loadTable();
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login.html';
});

const pwdModal = document.getElementById('pwdModal');
const pwdError = document.getElementById('pwdError');
document.getElementById('pwdBtn').addEventListener('click', () => {
  pwdError.classList.remove('show');
  document.getElementById('pwdForm').reset();
  pwdModal.style.display = 'flex';
});
document.getElementById('pwdCancel').addEventListener('click', () => { pwdModal.style.display = 'none'; });

document.getElementById('pwdForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const res = await fetch('/api/me/password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    pwdError.textContent = data.error || 'Nie udało się zmienić hasła';
    pwdError.classList.add('show');
    return;
  }
  pwdModal.style.display = 'none';
  alert('Hasło zostało zmienione.');
});

init();
