var THEME_STYLES = ['liquid', 'modern', 'esbro'];

function getThemeStyle() {
  try {
    var s = localStorage.getItem('themeStyle');
    if (THEME_STYLES.indexOf(s) !== -1) return s;
  } catch (e) {}
  return 'liquid';
}

function setThemeStyle(style) {
  if (THEME_STYLES.indexOf(style) === -1) return;
  document.documentElement.setAttribute('data-style', style);
  try { localStorage.setItem('themeStyle', style); } catch (e) {}
}

(function () {
  function applyToggle(btn, theme) {
    if (!btn) return;
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    var label = theme === 'dark' ? t('themeToggleToLight') : t('themeToggleToDark');
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('themeToggle');
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    applyToggle(btn, current);

    if (btn) {
      btn.addEventListener('click', function () {
        var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('theme', next); } catch (e) {}
        applyToggle(btn, next);
      });
    }

    document.addEventListener('i18n:changed', function () {
      applyToggle(btn, document.documentElement.getAttribute('data-theme') || 'light');
    });
  });
})();
