(async function checkExistingSession() {
  const res = await fetch('/api/me');
  const data = await res.json();
  if (data.user) window.location.href = '/index.html';
})();

const form = document.getElementById('loginForm');
const errorMsg = document.getElementById('errorMsg');
const loginBtn = document.getElementById('loginBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.classList.remove('show');
  loginBtn.disabled = true;
  loginBtn.textContent = 'Logowanie…';

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Błąd logowania');
    window.location.href = '/index.html';
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.classList.add('show');
    loginBtn.disabled = false;
    loginBtn.textContent = 'Zaloguj się';
  }
});
