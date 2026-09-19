const SUPPORTED_LANGS = ['en', 'pl', 'nl'];
const DEFAULT_LANG = 'en';

const translations = {
  en: {
    docTitleIndex: 'Table',
    docTitleAdmin: 'Settings — Table',
    docTitleLogin: 'Log in — Table',

    brand: 'Table',
    settingsLink: 'Settings',
    userBtn: 'User',
    logoutBtn: 'Log out',
    loginLink: 'Log in',
    themeToggleTitle: 'Toggle theme',
    themeToggleToLight: 'Switch to light theme',
    themeToggleToDark: 'Switch to dark theme',
    langToggleTitle: 'Change language',
    backToTableLink: '← Back to table',

    roleAdmin: 'Administrator',
    roleEditor: 'Editor',
    roleViewer: 'Viewer',

    pageTitleSheet: 'Data sheet',
    addRowBtn: '+ Add row',
    addDividerBtn: '+ Add separator',
    exportExcelBtn: '⇩ Excel',
    exportPdfBtn: '⇩ PDF',
    emptyStateRows: 'No rows yet. Add your first entry.',

    userModalTitle: 'User settings',
    languageLabel: 'Language',
    currentPasswordLabel: 'Current password',
    newPasswordLabel: 'New password (min. 6 characters)',
    saveBtn: 'Save',
    cancelBtn: 'Cancel',
    passwordChangedAlert: 'Password changed.',

    deleteRowTitle: 'Delete row',
    deleteDividerTitle: 'Delete separator',
    confirmDeleteRow: 'Delete this row?',

    loginTitle: 'Welcome back',
    loginSubtitle: 'Log in to view the table.',
    usernameLabel: 'Username',
    passwordLabel: 'Password',
    loginSubmit: 'Log in',
    loginInProgress: 'Logging in…',

    pageTitleSettings: 'Settings',
    tabTable: 'Table',
    tabUsers: 'Users',
    tabArchive: 'Archive',

    tableNameTitle: 'Table name',
    tableNameLabel: 'Displayed name',
    tableNamePlaceholder: 'e.g. Equipment log',

    appearanceTitle: 'Appearance',
    themeStyleLabel: 'Theme',
    themeStyleLiquid: 'Liquid',
    themeStyleModern: 'Modern',
    themeStyleEsbro: 'Esbro',
    themeStyleDesc: 'Choose the app\'s visual style. Combine it with the light/dark toggle in the top bar.',

    sharingTitle: 'Sharing',
    publicViewLabel: 'Table publicly visible',
    publicViewDesc: 'When enabled, anyone with the link to the homepage sees the table (read-only) without logging in.',

    columnsTitle: 'Table columns',
    columnNameLabel: 'Column name',
    typeLabel: 'Type',
    typeText: 'Text',
    typeNumber: 'Number',
    typeSelect: 'Dropdown list',
    optionsLabel: 'Options (one per line)',
    optionsPlaceholder: 'e.g.\nWorking\nNeeds repair\nOut of service',
    addColumnBtn: 'Add column',

    usersTitle: 'Users',
    roleFieldLabel: 'Role',
    addUserBtn: 'Add user',

    archiveTitle: 'Table archive',
    archiveDesc: 'Every day at 8:00 PM, a snapshot of the current table is automatically saved, labeled with the date.',
    archiveEmptyRows: 'No rows in this snapshot.',
    archivePreviewDefaultTitle: 'Preview',
    archivesEmpty: 'No snapshots saved yet. The first one will be created today at 8:00 PM.',
    rowCountSingular: 'row',
    rowCountPlural: 'rows',
    previewBtn: 'Preview',
    editBtn: 'Edit',
    deleteBtn: 'Delete',
    saveChangesBtn: 'Save changes',

    selectMetaPrefix: 'Dropdown list — ',
    selectOptionsNoneMeta: 'no options',
    confirmDeleteColumn: 'Delete column "{name}"? This will also delete all data in this column.',
    confirmDeleteUser: 'Delete user "{name}"?',
    confirmDeleteArchive: 'Delete the snapshot from {date}?',
    archivePreviewTitleWithDate: 'Preview — {date}',

    errSaveCellFallback: 'Failed to save the cell.',
    errDeleteRowFallback: 'Failed to delete the row.',
    errAddRowFallback: 'Failed to add the row.',
    errAddDividerFallback: 'Failed to add the separator.',
    errChangePasswordFallback: 'Failed to change the password.',
    errLoginFallback: 'Login failed.',
    errLoadArchiveFallback: 'Failed to load the snapshot.',
    errAddColumnOptionsRequired: 'Provide at least one option.',
    errSaveSettingFallback: 'Failed to save the setting.',
    errGenericFallback: 'Something went wrong.',

    error_AUTH_REQUIRED: 'You are not logged in.',
    error_FORBIDDEN: 'You do not have permission to do this.',
    error_METHOD_NOT_ALLOWED: 'This method is not allowed.',
    error_MISSING_DATA: 'Missing data.',
    error_COLUMN_NOT_FOUND: 'Column not found.',
    error_VALUE_MUST_BE_NUMBER: 'This column requires a numeric value.',
    error_VALUE_NOT_ALLOWED: 'The selected value is not one of the allowed options.',
    error_COLUMN_NAME_REQUIRED: 'Please provide a column name.',
    error_SELECT_OPTIONS_REQUIRED: 'A dropdown list requires at least one option.',
    error_COLUMN_ID_REQUIRED: 'Missing column id.',
    error_LOGIN_PASSWORD_REQUIRED: 'Please provide a username and password.',
    error_INVALID_CREDENTIALS: 'Invalid username or password.',
    error_CURRENT_NEW_PASSWORD_REQUIRED: 'Please provide your current and new password.',
    error_PASSWORD_TOO_SHORT: 'The new password must be at least 6 characters long.',
    error_CURRENT_PASSWORD_INVALID: 'The current password is incorrect.',
    error_ROW_ID_REQUIRED: 'Missing row id.',
    error_INVALID_USER_DATA: 'Invalid data.',
    error_USERNAME_TAKEN: 'This username is already taken.',
    error_USER_ID_REQUIRED: 'Missing user id.',
    error_USER_NOT_FOUND: 'User not found.',
    error_CANNOT_DELETE_SELF: 'You cannot delete your own account.',
    error_ARCHIVE_NOT_FOUND: 'Archive not found.',
    error_ARCHIVE_ID_REQUIRED: 'Missing archive id.',
    error_TABLE_NAME_TOO_LONG: 'The table name must be 100 characters or fewer.',
  },

  pl: {
    docTitleIndex: 'Tabela',
    docTitleAdmin: 'Ustawienia — Tabela',
    docTitleLogin: 'Logowanie — Tabela',

    brand: 'Tabela',
    settingsLink: 'Ustawienia',
    userBtn: 'Użytkownik',
    logoutBtn: 'Wyloguj',
    loginLink: 'Zaloguj się',
    themeToggleTitle: 'Przełącz motyw',
    themeToggleToLight: 'Przełącz na jasny motyw',
    themeToggleToDark: 'Przełącz na ciemny motyw',
    langToggleTitle: 'Zmień język',
    backToTableLink: '← Wróć do tabeli',

    roleAdmin: 'Administrator',
    roleEditor: 'Edytor',
    roleViewer: 'Przeglądający',

    pageTitleSheet: 'Arkusz danych',
    addRowBtn: '+ Dodaj wiersz',
    addDividerBtn: '+ Dodaj separator',
    exportExcelBtn: '⇩ Excel',
    exportPdfBtn: '⇩ PDF',
    emptyStateRows: 'Brak wierszy. Dodaj pierwszy wpis.',

    userModalTitle: 'Ustawienia użytkownika',
    languageLabel: 'Język',
    currentPasswordLabel: 'Obecne hasło',
    newPasswordLabel: 'Nowe hasło (min. 6 znaków)',
    saveBtn: 'Zapisz',
    cancelBtn: 'Anuluj',
    passwordChangedAlert: 'Hasło zostało zmienione.',

    deleteRowTitle: 'Usuń wiersz',
    deleteDividerTitle: 'Usuń separator',
    confirmDeleteRow: 'Usunąć ten wiersz?',

    loginTitle: 'Witaj z powrotem',
    loginSubtitle: 'Zaloguj się, aby zobaczyć tabelę.',
    usernameLabel: 'Login',
    passwordLabel: 'Hasło',
    loginSubmit: 'Zaloguj się',
    loginInProgress: 'Logowanie…',

    pageTitleSettings: 'Ustawienia',
    tabTable: 'Tabela',
    tabUsers: 'Użytkownicy',
    tabArchive: 'Archiwum',

    tableNameTitle: 'Nazwa tabeli',
    tableNameLabel: 'Wyświetlana nazwa',
    tableNamePlaceholder: 'np. Ewidencja sprzętu',

    appearanceTitle: 'Wygląd',
    themeStyleLabel: 'Motyw',
    themeStyleLiquid: 'Liquid',
    themeStyleModern: 'Nowoczesny',
    themeStyleEsbro: 'Esbro',
    themeStyleDesc: 'Wybierz styl wizualny aplikacji. Połącz go z przełącznikiem jasny/ciemny na górnym pasku.',

    sharingTitle: 'Udostępnianie',
    publicViewLabel: 'Tabela widoczna publicznie',
    publicViewDesc: 'Gdy włączone, każdy z linkiem do strony głównej zobaczy tabelę (tylko do odczytu) bez logowania.',

    columnsTitle: 'Kolumny tabeli',
    columnNameLabel: 'Nazwa kolumny',
    typeLabel: 'Typ',
    typeText: 'Tekst',
    typeNumber: 'Liczba',
    typeSelect: 'Lista wyboru',
    optionsLabel: 'Opcje do wyboru (jedna na linię)',
    optionsPlaceholder: 'np.\nSprawne\nDo naprawy\nWyłączone',
    addColumnBtn: 'Dodaj kolumnę',

    usersTitle: 'Użytkownicy',
    roleFieldLabel: 'Rola',
    addUserBtn: 'Dodaj użytkownika',

    archiveTitle: 'Archiwum tabeli',
    archiveDesc: 'Codziennie o 20:00 automatycznie zapisywana jest migawka bieżącej tabeli, oznaczona datą.',
    archiveEmptyRows: 'Brak wierszy w tej migawce.',
    archivePreviewDefaultTitle: 'Podgląd',
    archivesEmpty: 'Brak zapisanych migawek. Pierwsza powstanie dziś o 20:00.',
    rowCountSingular: 'wiersz',
    rowCountPlural: 'wierszy',
    previewBtn: 'Podgląd',
    editBtn: 'Edytuj',
    deleteBtn: 'Usuń',
    saveChangesBtn: 'Zapisz zmiany',

    selectMetaPrefix: 'Lista wyboru — ',
    selectOptionsNoneMeta: 'brak opcji',
    confirmDeleteColumn: 'Usunąć kolumnę „{name}”? Usunie to też wszystkie dane w tej kolumnie.',
    confirmDeleteUser: 'Usunąć użytkownika „{name}”?',
    confirmDeleteArchive: 'Usunąć migawkę z dnia {date}?',
    archivePreviewTitleWithDate: 'Podgląd — {date}',

    errSaveCellFallback: 'Nie udało się zapisać komórki.',
    errDeleteRowFallback: 'Nie udało się usunąć wiersza.',
    errAddRowFallback: 'Nie udało się dodać wiersza.',
    errAddDividerFallback: 'Nie udało się dodać separatora.',
    errChangePasswordFallback: 'Nie udało się zmienić hasła.',
    errLoginFallback: 'Błąd logowania.',
    errLoadArchiveFallback: 'Nie udało się wczytać migawki.',
    errAddColumnOptionsRequired: 'Podaj co najmniej jedną opcję do wyboru.',
    errSaveSettingFallback: 'Nie udało się zapisać ustawienia.',
    errGenericFallback: 'Coś poszło nie tak.',

    error_AUTH_REQUIRED: 'Niezalogowany.',
    error_FORBIDDEN: 'Brak uprawnień.',
    error_METHOD_NOT_ALLOWED: 'Niedozwolona metoda.',
    error_MISSING_DATA: 'Brak danych.',
    error_COLUMN_NOT_FOUND: 'Nie znaleziono kolumny.',
    error_VALUE_MUST_BE_NUMBER: 'Ta kolumna wymaga wartości liczbowej.',
    error_VALUE_NOT_ALLOWED: 'Wybrana wartość nie jest jedną z dozwolonych opcji.',
    error_COLUMN_NAME_REQUIRED: 'Podaj nazwę kolumny.',
    error_SELECT_OPTIONS_REQUIRED: 'Lista wyboru wymaga co najmniej jednej opcji.',
    error_COLUMN_ID_REQUIRED: 'Brak id kolumny.',
    error_LOGIN_PASSWORD_REQUIRED: 'Podaj login i hasło.',
    error_INVALID_CREDENTIALS: 'Nieprawidłowy login lub hasło.',
    error_CURRENT_NEW_PASSWORD_REQUIRED: 'Podaj obecne i nowe hasło.',
    error_PASSWORD_TOO_SHORT: 'Nowe hasło musi mieć co najmniej 6 znaków.',
    error_CURRENT_PASSWORD_INVALID: 'Obecne hasło jest nieprawidłowe.',
    error_ROW_ID_REQUIRED: 'Brak id wiersza.',
    error_INVALID_USER_DATA: 'Nieprawidłowe dane.',
    error_USERNAME_TAKEN: 'Login już istnieje.',
    error_USER_ID_REQUIRED: 'Brak id użytkownika.',
    error_USER_NOT_FOUND: 'Nie znaleziono użytkownika.',
    error_CANNOT_DELETE_SELF: 'Nie możesz usunąć własnego konta.',
    error_ARCHIVE_NOT_FOUND: 'Nie znaleziono archiwum.',
    error_ARCHIVE_ID_REQUIRED: 'Brak id archiwum.',
    error_TABLE_NAME_TOO_LONG: 'Nazwa tabeli może mieć maksymalnie 100 znaków.',
  },

  nl: {
    docTitleIndex: 'Tabel',
    docTitleAdmin: 'Instellingen — Tabel',
    docTitleLogin: 'Inloggen — Tabel',

    brand: 'Tabel',
    settingsLink: 'Instellingen',
    userBtn: 'Gebruiker',
    logoutBtn: 'Uitloggen',
    loginLink: 'Inloggen',
    themeToggleTitle: 'Thema wisselen',
    themeToggleToLight: 'Overschakelen naar licht thema',
    themeToggleToDark: 'Overschakelen naar donker thema',
    langToggleTitle: 'Taal wijzigen',
    backToTableLink: '← Terug naar de tabel',

    roleAdmin: 'Beheerder',
    roleEditor: 'Redacteur',
    roleViewer: 'Kijker',

    pageTitleSheet: 'Gegevensblad',
    addRowBtn: '+ Rij toevoegen',
    addDividerBtn: '+ Scheiding toevoegen',
    exportExcelBtn: '⇩ Excel',
    exportPdfBtn: '⇩ PDF',
    emptyStateRows: 'Nog geen rijen. Voeg de eerste vermelding toe.',

    userModalTitle: 'Gebruikersinstellingen',
    languageLabel: 'Taal',
    currentPasswordLabel: 'Huidig wachtwoord',
    newPasswordLabel: 'Nieuw wachtwoord (min. 6 tekens)',
    saveBtn: 'Opslaan',
    cancelBtn: 'Annuleren',
    passwordChangedAlert: 'Wachtwoord gewijzigd.',

    deleteRowTitle: 'Rij verwijderen',
    deleteDividerTitle: 'Scheiding verwijderen',
    confirmDeleteRow: 'Deze rij verwijderen?',

    loginTitle: 'Welkom terug',
    loginSubtitle: 'Log in om de tabel te bekijken.',
    usernameLabel: 'Gebruikersnaam',
    passwordLabel: 'Wachtwoord',
    loginSubmit: 'Inloggen',
    loginInProgress: 'Bezig met inloggen…',

    pageTitleSettings: 'Instellingen',
    tabTable: 'Tabel',
    tabUsers: 'Gebruikers',
    tabArchive: 'Archief',

    tableNameTitle: 'Tabelnaam',
    tableNameLabel: 'Weergegeven naam',
    tableNamePlaceholder: 'bijv. Materiaalregister',

    appearanceTitle: 'Weergave',
    themeStyleLabel: 'Thema',
    themeStyleLiquid: 'Liquid',
    themeStyleModern: 'Modern',
    themeStyleEsbro: 'Esbro',
    themeStyleDesc: 'Kies de visuele stijl van de app. Combineer dit met de licht/donker-schakelaar in de bovenbalk.',

    sharingTitle: 'Delen',
    publicViewLabel: 'Tabel openbaar zichtbaar',
    publicViewDesc: 'Indien ingeschakeld, ziet iedereen met de link naar de startpagina de tabel (alleen-lezen) zonder in te loggen.',

    columnsTitle: 'Tabelkolommen',
    columnNameLabel: 'Kolomnaam',
    typeLabel: 'Type',
    typeText: 'Tekst',
    typeNumber: 'Getal',
    typeSelect: 'Keuzelijst',
    optionsLabel: 'Opties (één per regel)',
    optionsPlaceholder: 'bijv.\nWerkend\nReparatie nodig\nBuiten dienst',
    addColumnBtn: 'Kolom toevoegen',

    usersTitle: 'Gebruikers',
    roleFieldLabel: 'Rol',
    addUserBtn: 'Gebruiker toevoegen',

    archiveTitle: 'Tabelarchief',
    archiveDesc: 'Elke dag om 20:00 uur wordt automatisch een momentopname van de huidige tabel opgeslagen, gelabeld met de datum.',
    archiveEmptyRows: 'Geen rijen in deze momentopname.',
    archivePreviewDefaultTitle: 'Voorbeeld',
    archivesEmpty: 'Nog geen momentopnamen opgeslagen. De eerste wordt vandaag om 20:00 uur gemaakt.',
    rowCountSingular: 'rij',
    rowCountPlural: 'rijen',
    previewBtn: 'Voorbeeld',
    editBtn: 'Bewerken',
    deleteBtn: 'Verwijderen',
    saveChangesBtn: 'Wijzigingen opslaan',

    selectMetaPrefix: 'Keuzelijst — ',
    selectOptionsNoneMeta: 'geen opties',
    confirmDeleteColumn: 'Kolom "{name}" verwijderen? Hiermee worden ook alle gegevens in deze kolom verwijderd.',
    confirmDeleteUser: 'Gebruiker "{name}" verwijderen?',
    confirmDeleteArchive: 'Momentopname van {date} verwijderen?',
    archivePreviewTitleWithDate: 'Voorbeeld — {date}',

    errSaveCellFallback: 'Kon de cel niet opslaan.',
    errDeleteRowFallback: 'Kon de rij niet verwijderen.',
    errAddRowFallback: 'Kon de rij niet toevoegen.',
    errAddDividerFallback: 'Kon de scheiding niet toevoegen.',
    errChangePasswordFallback: 'Kon het wachtwoord niet wijzigen.',
    errLoginFallback: 'Inloggen mislukt.',
    errLoadArchiveFallback: 'Kon de momentopname niet laden.',
    errAddColumnOptionsRequired: 'Geef minstens één optie op.',
    errSaveSettingFallback: 'Kon de instelling niet opslaan.',
    errGenericFallback: 'Er is iets misgegaan.',

    error_AUTH_REQUIRED: 'Je bent niet ingelogd.',
    error_FORBIDDEN: 'Je hebt hier geen toestemming voor.',
    error_METHOD_NOT_ALLOWED: 'Deze methode is niet toegestaan.',
    error_MISSING_DATA: 'Ontbrekende gegevens.',
    error_COLUMN_NOT_FOUND: 'Kolom niet gevonden.',
    error_VALUE_MUST_BE_NUMBER: 'Deze kolom vereist een numerieke waarde.',
    error_VALUE_NOT_ALLOWED: 'De geselecteerde waarde is geen toegestane optie.',
    error_COLUMN_NAME_REQUIRED: 'Geef een kolomnaam op.',
    error_SELECT_OPTIONS_REQUIRED: 'Een keuzelijst vereist minstens één optie.',
    error_COLUMN_ID_REQUIRED: 'Kolom-id ontbreekt.',
    error_LOGIN_PASSWORD_REQUIRED: 'Geef een gebruikersnaam en wachtwoord op.',
    error_INVALID_CREDENTIALS: 'Ongeldige gebruikersnaam of wachtwoord.',
    error_CURRENT_NEW_PASSWORD_REQUIRED: 'Geef je huidige en nieuwe wachtwoord op.',
    error_PASSWORD_TOO_SHORT: 'Het nieuwe wachtwoord moet minstens 6 tekens lang zijn.',
    error_CURRENT_PASSWORD_INVALID: 'Het huidige wachtwoord is onjuist.',
    error_ROW_ID_REQUIRED: 'Rij-id ontbreekt.',
    error_INVALID_USER_DATA: 'Ongeldige gegevens.',
    error_USERNAME_TAKEN: 'Deze gebruikersnaam is al in gebruik.',
    error_USER_ID_REQUIRED: 'Gebruikers-id ontbreekt.',
    error_USER_NOT_FOUND: 'Gebruiker niet gevonden.',
    error_CANNOT_DELETE_SELF: 'Je kunt je eigen account niet verwijderen.',
    error_ARCHIVE_NOT_FOUND: 'Archief niet gevonden.',
    error_ARCHIVE_ID_REQUIRED: 'Archief-id ontbreekt.',
    error_TABLE_NAME_TOO_LONG: 'De tabelnaam mag maximaal 100 tekens bevatten.',
  },
};

function getLang() {
  try {
    const l = localStorage.getItem('lang');
    if (l && translations[l]) return l;
  } catch (e) {}
  return DEFAULT_LANG;
}

function setLang(lang) {
  if (!translations[lang]) return;
  try { localStorage.setItem('lang', lang); } catch (e) {}
  applyTranslations();
}

function t(key, params) {
  const lang = getLang();
  const dict = translations[lang] || translations[DEFAULT_LANG];
  let str = dict[key] !== undefined ? dict[key] : translations[DEFAULT_LANG][key];
  if (str === undefined) return key;
  if (params) {
    Object.keys(params).forEach(k => {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), () => params[k]);
    });
  }
  return str;
}

function apiErrorMessage(data, fallbackKey) {
  if (data && data.code) return t('error_' + data.code);
  if (data && data.error) return data.error;
  return t(fallbackKey || 'errGenericFallback');
}

const ROLE_AVATAR_ICONS = {
  admin: '<path d="M5 16 3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5Z"/><path d="M5 16h14v3H5z"/>',
  editor: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
  viewer: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
};

function roleAvatarHTML(role, size) {
  const icon = ROLE_AVATAR_ICONS[role] || ROLE_AVATAR_ICONS.viewer;
  const label = roleLabel(role);
  const sizeClass = size === 'sm' ? ' avatar--sm' : '';
  return `<span class="avatar avatar--${role}${sizeClass}" title="${label}" aria-hidden="true">` +
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon}</svg>` +
    `</span>`;
}

function applyTranslations() {
  const lang = getLang();
  document.documentElement.setAttribute('lang', lang);

  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.setAttribute('title', t(el.getAttribute('data-i18n-title')));
  });

  const titleKey = document.documentElement.getAttribute('data-i18n-doctitle');
  if (titleKey) document.title = t(titleKey);

  const langBtn = document.getElementById('langToggle');
  if (langBtn) langBtn.textContent = lang.toUpperCase();

  document.dispatchEvent(new CustomEvent('i18n:changed'));
}

document.addEventListener('DOMContentLoaded', () => {
  applyTranslations();

  const langBtn = document.getElementById('langToggle');
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      const current = getLang();
      const idx = SUPPORTED_LANGS.indexOf(current);
      const next = SUPPORTED_LANGS[(idx + 1) % SUPPORTED_LANGS.length];
      setLang(next);
    });
  }
});
