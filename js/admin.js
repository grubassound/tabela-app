function roleLabel(role) {
  return t({ admin: 'roleAdmin', editor: 'roleEditor', viewer: 'roleViewer' }[role] || role);
}
function typeLabel(type) {
  return t({ text: 'typeText', number: 'typeNumber', select: 'typeSelect' }[type] || type);
}

async function init() {
  const meRes = await fetch('api/me.php');
  const me = await meRes.json();
  if (!me.user) { window.location.href = 'login.html'; return; }
  if (me.user.role !== 'admin') { window.location.href = 'index.html'; return; }
  document.getElementById('usernameLabel').textContent = me.user.username;
  document.getElementById('userAvatar').innerHTML = roleAvatarHTML('admin');

  initTabs();
  document.getElementById('themeStyleSelect').value = getThemeStyle();
  await loadColumns();
  await loadUsers();
  await loadSettings();
  await loadArchives();
}

function initTabs() {
  const tabs = Array.from(document.querySelectorAll('#adminTabs a[data-tab]'));
  const panels = Array.from(document.querySelectorAll('.tab-panel[data-tab-panel]'));

  function activate(name) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    panels.forEach(p => { p.hidden = p.dataset.tabPanel !== name; });
  }

  tabs.forEach(t => {
    t.addEventListener('click', (e) => {
      e.preventDefault();
      activate(t.dataset.tab);
      history.replaceState(null, '', `#${t.dataset.tab}`);
    });
  });

  const requested = location.hash.replace('#', '');
  activate(tabs.some(t => t.dataset.tab === requested) ? requested : 'tabela');
}

async function loadSettings() {
  const res = await fetch('api/settings.php');
  const data = await res.json();
  document.getElementById('publicViewToggle').checked = !!data.publicView;
  const tableNameInput = document.getElementById('tableNameInput');
  if (document.activeElement !== tableNameInput) {
    tableNameInput.value = data.tableName || '';
  }
  applyTableNameToBrand(data.tableName || '');
}

function applyTableNameToBrand(name) {
  const brandEl = document.querySelector('.topbar__brand');
  if (brandEl) brandEl.textContent = name || t('brand');
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
      ? `${t('selectMetaPrefix')}${(col.options || []).join(', ') || t('selectOptionsNoneMeta')}`
      : typeLabel(col.type);

    row.innerHTML = `
      <div class="list-row__main">
        <div class="list-row__name">${escapeHtml(col.name)}</div>
        <div class="list-row__meta">${escapeHtml(meta)}</div>
      </div>
    `;
    const editBtn = document.createElement('button');
    editBtn.className = 'btn';
    editBtn.textContent = t('editBtn');
    editBtn.addEventListener('click', () => toggleColumnEdit(col, row));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn--danger';
    delBtn.textContent = t('deleteBtn');
    delBtn.addEventListener('click', async () => {
      if (!confirm(t('confirmDeleteColumn', { name: col.name }))) return;
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
      <label>${t('columnNameLabel')}</label>
      <input type="text" class="edit-name" value="${escapeAttr(col.name)}" required>
    </div>
    <div class="field">
      <label>${t('typeLabel')}</label>
      <select class="edit-type">
        <option value="text" ${col.type === 'text' ? 'selected' : ''}>${t('typeText')}</option>
        <option value="number" ${col.type === 'number' ? 'selected' : ''}>${t('typeNumber')}</option>
        <option value="select" ${col.type === 'select' ? 'selected' : ''}>${t('typeSelect')}</option>
      </select>
    </div>
    <div class="field edit-options-field" style="flex-basis:100%; ${col.type === 'select' ? '' : 'display:none;'}">
      <label>${t('optionsLabel')}</label>
      <textarea class="edit-options" rows="3">${(col.options || []).join('\n')}</textarea>
    </div>
    <button type="submit" class="btn btn--primary">${t('saveChangesBtn')}</button>
    <button type="button" class="btn edit-cancel">${t('cancelBtn')}</button>
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
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(apiErrorMessage(d)); return; }
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
      ${roleAvatarHTML(u.role, 'sm')}
      <div class="list-row__main">
        <div class="list-row__name">${escapeHtml(u.username)}</div>
        <div class="list-row__meta">${roleLabel(u.role)}</div>
      </div>
    `;
    const select = document.createElement('select');
    select.className = 'btn';
    ['viewer', 'editor', 'admin'].forEach(r => {
      const opt = document.createElement('option');
      opt.value = r; opt.textContent = roleLabel(r);
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
    delBtn.textContent = t('deleteBtn');
    delBtn.addEventListener('click', async () => {
      if (!confirm(t('confirmDeleteUser', { name: u.username }))) return;
      const r = await fetch(`api/users.php?id=${u.id}`, { method: 'DELETE' });
      if (!r.ok) { const d = await r.json().catch(() => ({})); alert(apiErrorMessage(d)); return; }
      loadUsers();
    });
    row.appendChild(select);
    row.appendChild(delBtn);
    list.appendChild(row);
  });
}

async function loadArchives() {
  const res = await fetch('api/archives.php');
  const data = await res.json();
  const list = document.getElementById('archivesList');
  list.innerHTML = '';

  if (!data.archives || data.archives.length === 0) {
    list.innerHTML = `<div class="empty-state">${escapeHtml(t('archivesEmpty'))}</div>`;
    return;
  }

  data.archives.forEach(a => {
    const row = document.createElement('div');
    row.className = 'list-row';
    const rowCountLabel = a.rowCount === 1 ? t('rowCountSingular') : t('rowCountPlural');
    row.innerHTML = `
      <div class="list-row__main">
        <div class="list-row__name">${escapeHtml(a.date)}</div>
        <div class="list-row__meta">${a.rowCount} ${escapeHtml(rowCountLabel)}</div>
      </div>
    `;
    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn';
    viewBtn.textContent = t('previewBtn');
    viewBtn.addEventListener('click', () => viewArchive(a.date));

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn--danger';
    delBtn.textContent = t('deleteBtn');
    delBtn.addEventListener('click', async () => {
      if (!confirm(t('confirmDeleteArchive', { date: a.date }))) return;
      await fetch(`api/archives.php?id=${a.id}`, { method: 'DELETE' });
      const preview = document.getElementById('archivePreviewPanel');
      if (preview.dataset.date === a.date) preview.hidden = true;
      loadArchives();
    });

    row.appendChild(viewBtn);
    row.appendChild(delBtn);
    list.appendChild(row);
  });
}

async function viewArchive(date) {
  const res = await fetch(`api/archives.php?date=${encodeURIComponent(date)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    alert(apiErrorMessage(data, 'errLoadArchiveFallback'));
    return;
  }
  const data = await res.json();

  const preview = document.getElementById('archivePreviewPanel');
  preview.dataset.date = date;
  document.getElementById('archivePreviewTitle').textContent = t('archivePreviewTitleWithDate', { date });

  const headRow = document.getElementById('archiveHeadRow');
  const bodyRows = document.getElementById('archiveBodyRows');
  const emptyState = document.getElementById('archiveEmptyState');

  headRow.innerHTML = '';
  data.columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col.name;
    headRow.appendChild(th);
  });

  bodyRows.innerHTML = '';
  emptyState.style.display = data.rows.length === 0 ? 'block' : 'none';

  data.rows.forEach(row => {
    const tr = document.createElement('tr');

    if (row.isDivider) {
      const td = document.createElement('td');
      td.className = 'divider-cell';
      td.colSpan = data.columns.length || 1;
      td.innerHTML = '<hr class="divider-line">';
      tr.appendChild(td);
      bodyRows.appendChild(tr);
      return;
    }

    data.columns.forEach(col => {
      const td = document.createElement('td');
      const cellData = row.cells[col.id] || { value: '', isLine: false };
      const wrap = document.createElement('div');
      wrap.className = 'cell-wrap';
      if (cellData.isLine) {
        wrap.innerHTML = '<hr class="cell-line">';
      } else {
        const span = document.createElement('span');
        span.className = 'cell';
        span.textContent = cellData.value || '';
        wrap.appendChild(span);
      }
      td.appendChild(wrap);
      tr.appendChild(td);
    });
    bodyRows.appendChild(tr);
  });

  preview.hidden = false;
  preview.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    alert(t('errAddColumnOptionsRequired'));
    return;
  }
  const res = await fetch('api/columns.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type, options })
  });
  if (!res.ok) { const d = await res.json().catch(() => ({})); alert(apiErrorMessage(d)); return; }
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
  if (!res.ok) { const d = await res.json().catch(() => ({})); alert(apiErrorMessage(d)); return; }
  document.getElementById('userLogin').value = '';
  document.getElementById('userPassword').value = '';
  loadUsers();
});

document.getElementById('themeStyleSelect').addEventListener('change', (e) => {
  setThemeStyle(e.target.value);
});

document.getElementById('publicViewToggle').addEventListener('change', async (e) => {
  const publicView = e.target.checked;
  const res = await fetch('api/settings.php', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicView })
  });
  if (!res.ok) {
    e.target.checked = !publicView;
    const d = await res.json().catch(() => ({}));
    alert(apiErrorMessage(d, 'errSaveSettingFallback'));
  }
});

document.getElementById('tableNameForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const tableName = document.getElementById('tableNameInput').value.trim();
  const res = await fetch('api/settings.php', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tableName })
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    alert(apiErrorMessage(d, 'errSaveSettingFallback'));
    return;
  }
  applyTableNameToBrand(tableName);
});

document.addEventListener('i18n:changed', () => {
  loadColumns();
  loadUsers();
  loadArchives();
  loadSettings();
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('api/logout.php', { method: 'POST' });
  window.location.href = 'login.html';
});

const userModal = document.getElementById('userModal');
const pwdError = document.getElementById('pwdError');
document.getElementById('userBtn').addEventListener('click', () => {
  pwdError.classList.remove('show');
  document.getElementById('pwdForm').reset();
  document.getElementById('userLangSelect').value = getLang();
  userModal.style.display = 'flex';
});
document.getElementById('pwdCancel').addEventListener('click', () => { userModal.style.display = 'none'; });
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
  userModal.style.display = 'none';
  alert(t('passwordChangedAlert'));
});

init();
