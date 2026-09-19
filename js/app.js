let state = { columns: [], rows: [], role: 'viewer' };
let currentUser = null;

async function init() {
  const meRes = await fetch('api/me.php');
  const me = await meRes.json();
  currentUser = me.user;

  applyUserChrome();
  await loadTable();
}

function applyUserChrome() {
  const rolePill = document.getElementById('rolePill');
  const userAvatar = document.getElementById('userAvatar');
  const userBtn = document.getElementById('userBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginLink = document.getElementById('loginLink');
  const adminLink = document.getElementById('adminLink');
  const addRowBtn = document.getElementById('addRowBtn');
  const addDividerBtn = document.getElementById('addDividerBtn');
  const canEdit = !!currentUser && (currentUser.role === 'admin' || currentUser.role === 'editor');

  document.getElementById('usernameLabel').textContent = currentUser ? currentUser.username : '';
  rolePill.style.display = currentUser ? '' : 'none';
  userAvatar.style.display = currentUser ? '' : 'none';
  if (currentUser) {
    rolePill.textContent = roleLabel(currentUser.role);
    userAvatar.innerHTML = roleAvatarHTML(currentUser.role);
  }
  userBtn.style.display = currentUser ? '' : 'none';
  logoutBtn.style.display = currentUser ? '' : 'none';
  loginLink.style.display = currentUser ? 'none' : '';
  adminLink.style.display = currentUser && currentUser.role === 'admin' ? '' : 'none';
  addRowBtn.style.display = canEdit ? '' : 'none';
  addDividerBtn.style.display = canEdit ? '' : 'none';
}

function roleLabel(role) {
  return t({ admin: 'roleAdmin', editor: 'roleEditor', viewer: 'roleViewer' }[role] || role);
}

async function loadTable() {
  const res = await fetch('api/table.php');
  if (res.status === 401) { window.location.href = 'login.html'; return; }
  state = await res.json();
  render();
}

function applyTableName() {
  const name = (state.tableName || '').trim();
  const brandEl = document.querySelector('.topbar__brand');
  const titleEl = document.querySelector('.page-header h1');
  if (brandEl) brandEl.textContent = name || t('brand');
  if (titleEl) titleEl.textContent = name || t('pageTitleSheet');
}

function render() {
  applyTableName();
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
  emptyState.style.display = state.rows.length === 0 ? 'block' : 'none';

  state.rows.forEach(row => {
    const tr = document.createElement('tr');

    if (row.isDivider) {
      const td = document.createElement('td');
      td.className = 'divider-cell';
      td.colSpan = state.columns.length || 1;
      td.innerHTML = '<hr class="divider-line">';
      tr.appendChild(td);
      if (canEdit) {
        tr.appendChild(makeRowActionsCell(row.id, t('deleteDividerTitle')));
      }
      bodyRows.appendChild(tr);
      return;
    }

    state.columns.forEach(col => {
      const td = document.createElement('td');
      const cellData = row.cells[col.id] || { value: '' };
      const currentValue = cellData.value || '';
      const wrap = document.createElement('div');
      wrap.className = 'cell-wrap';

      let control;
      if (col.type === 'select') {
        control = document.createElement('select');
        control.className = 'cell';
        const emptyOpt = document.createElement('option');
        emptyOpt.value = '';
        emptyOpt.textContent = '—';
        control.appendChild(emptyOpt);
        (col.options || []).forEach(opt => {
          const optionEl = document.createElement('option');
          optionEl.value = opt;
          optionEl.textContent = opt;
          if (opt === currentValue) optionEl.selected = true;
          control.appendChild(optionEl);
        });
        if (!canEdit) control.setAttribute('disabled', 'disabled');
        control.addEventListener('change', () => saveCell(row.id, col.id, control));
      } else {
        control = document.createElement('input');
        control.className = 'cell';
        control.value = currentValue;
        control.type = 'text';
        control.inputMode = col.type === 'number' ? 'decimal' : 'text';
        if (!canEdit) control.setAttribute('readonly', 'readonly');
        control.addEventListener('change', () => saveCell(row.id, col.id, control));
      }
      wrap.appendChild(control);

      td.appendChild(wrap);
      tr.appendChild(td);
    });

    if (canEdit) {
      tr.appendChild(makeRowActionsCell(row.id, t('deleteRowTitle')));
    }
    bodyRows.appendChild(tr);
  });
}

function makeRowActionsCell(rowId, title) {
  const td = document.createElement('td');
  td.className = 'row-actions-col';
  const btn = document.createElement('button');
  btn.className = 'row-del';
  btn.title = title;
  btn.textContent = '✕';
  btn.addEventListener('click', () => deleteRow(rowId));
  td.appendChild(btn);
  return td;
}

async function saveCell(rowId, columnId, input) {
  const prevValue = input.dataset.prev !== undefined ? input.dataset.prev : input.value;
  const value = input.value;
  const res = await fetch('api/cells.php', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rowId, columnId, value })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    alert(apiErrorMessage(data, 'errSaveCellFallback'));
    input.value = prevValue;
    return;
  }
  input.dataset.prev = value;
}

async function deleteRow(rowId) {
  if (!confirm(t('confirmDeleteRow'))) return;
  const res = await fetch(`api/rows.php?id=${rowId}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    alert(apiErrorMessage(data, 'errDeleteRowFallback'));
    return;
  }
  await loadTable();
}

document.getElementById('addRowBtn').addEventListener('click', async () => {
  const res = await fetch('api/rows.php', { method: 'POST' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    alert(apiErrorMessage(data, 'errAddRowFallback'));
    return;
  }
  await loadTable();
});

document.getElementById('addDividerBtn').addEventListener('click', async () => {
  const res = await fetch('api/rows.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ divider: true })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    alert(apiErrorMessage(data, 'errAddDividerFallback'));
    return;
  }
  await loadTable();
});

document.getElementById('exportPdfBtn').addEventListener('click', () => {
  window.print();
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('api/logout.php', { method: 'POST' });
  window.location.href = 'login.html';
});

const pwdModal = document.getElementById('userModal');
const pwdError = document.getElementById('pwdError');
document.getElementById('userBtn').addEventListener('click', () => {
  pwdError.classList.remove('show');
  document.getElementById('pwdForm').reset();
  document.getElementById('userLangSelect').value = getLang();
  pwdModal.style.display = 'flex';
});
document.getElementById('pwdCancel').addEventListener('click', () => { pwdModal.style.display = 'none'; });
document.getElementById('userLangSelect').addEventListener('change', (e) => {
  setLang(e.target.value);
});

document.getElementById('pwdForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const res = await fetch('api/me.php', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    pwdError.textContent = apiErrorMessage(data, 'errChangePasswordFallback');
    pwdError.classList.add('show');
    return;
  }
  pwdModal.style.display = 'none';
  alert(t('passwordChangedAlert'));
});

document.addEventListener('i18n:changed', () => {
  applyUserChrome();
  render();
});

init();
