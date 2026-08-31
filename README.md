# Tabela — aplikacja z logowaniem i rolami

Aplikacja webowa wyświetlająca edytowalną tabelę (arkusz), z logowaniem
i trzema rolami użytkowników:

- **Administrator** — zarządza kolumnami tabeli i użytkownikami (loginy, hasła, role).
- **Edytor** — może dodawać wiersze i edytować wartości komórek, ale nie ma dostępu
  do ustawień (kolumny, użytkownicy).
- **Przeglądający** — widzi tabelę wyłącznie w trybie odczytu, bez możliwości zmian.

Wszystkie uprawnienia są wymuszane po stronie serwera (nie tylko ukrywane w interfejsie),
więc nawet ktoś, kto spróbuje ominąć przeglądarkę, nie wykona akcji, do której nie ma prawa.

## Wymagania

- Node.js w wersji 18 lub nowszej (zalecane 20+)
- npm

## Instalacja

```bash
cd tabela-app
npm install
```

## Uruchomienie

```bash
npm start
```

Aplikacja domyślnie wystartuje na porcie **3000**: http://localhost:3000

Przy pierwszym uruchomieniu automatycznie:
- tworzy plik bazy danych `data.sqlite` (SQLite, zwykły plik — nie wymaga
  osobnego serwera bazodanowego),
- tworzy domyślnego administratora:
  - **login:** `admin`
  - **hasło:** `admin123`

  ⚠️ **Koniecznie zmień to hasło od razu po pierwszym zalogowaniu** — przycisk
  „Zmień hasło” w prawym górnym rogu po zalogowaniu.
- tworzy dwie przykładowe kolumny startowe: „Nazwa” (tekst) i „Wartość” (liczba) —
  możesz je dowolnie usunąć/zmienić z poziomu panelu Administratora.

## Jak działa

- **Backend:** Node.js + Express, baza danych SQLite (`better-sqlite3`).
- **Sesje logowania:** `express-session`, trzymane w tej samej bazie SQLite (przetrwają
  restart serwera), ciasteczko `httpOnly`, ważne 12 godzin.
- **Hasła:** hashowane przez `bcryptjs` — nigdy nie są zapisywane jawnym tekstem.
- **Frontend:** zwykły HTML/CSS/JS (bez frameworków) w katalogu `public/`.
- **Struktura tabeli jest dynamiczna** — administrator dodaje/usuwa kolumny z poziomu aplikacji
  (typu tekstowego, liczbowego lub **listy wyboru** z zdefiniowanymi przez siebie opcjami —
  edytorzy wtedy wybierają wartość z rozwijanej listy zamiast wpisywać dowolny tekst),
  a edytorzy dowolnie dodają nowe wiersze.

## Struktura projektu

```
tabela-app/
├── server.js           ← serwer Express + API + reguły uprawnień
├── database.js          ← inicjalizacja bazy SQLite i schemat tabel
├── package.json
├── data.sqlite           ← baza danych (tworzy się automatycznie, nie commitować)
└── public/
    ├── login.html
    ├── index.html         ← widok tabeli
    ├── admin.html          ← panel administratora (kolumny + użytkownicy)
    ├── css/style.css
    └── js/
        ├── login.js
        ├── app.js
        └── admin.js
```

## Wdrożenie produkcyjne (serwer / VPS)

1. Skopiuj cały katalog `tabela-app` na serwer.
2. `npm install --omit=dev`
3. Ustaw zmienną środowiskową `SESSION_SECRET` na losowy, długi ciąg znaków
   (inaczej sesje logowania będą podpisywane domyślnym, niebezpiecznym sekretem):
   ```bash
   export SESSION_SECRET="wklej-tu-losowy-dlugi-ciag-znakow"
   ```
4. Uruchom aplikację jako usługę w tle, np. przez `pm2`:
   ```bash
   npm install -g pm2
   pm2 start server.js --name tabela-app
   pm2 save
   pm2 startup
   ```
5. Postaw przed nią reverse proxy (nginx/Apache) z certyfikatem SSL (Let's Encrypt),
   żeby ruch (w tym hasła przy logowaniu) był szyfrowany przez HTTPS.
   Przykładowy fragment konfiguracji nginx:
   ```nginx
   location / {
       proxy_pass http://localhost:3000;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
   }
   ```
6. Zrób kopię zapasową pliku `data.sqlite` regularnie (to cała Twoja baza danych —
   użytkownicy, kolumny, wiersze, wartości komórek).

## Rozszerzenia, o które możesz poprosić

- Historia zmian komórek (kto i kiedy zmienił wartość).
- Sortowanie/filtrowanie kolumn, eksport do CSV/Excel/PDF.
- Możliwość przeciągania i zmiany kolejności kolumn/wierszy.
- Powiadomienia e-mail przy zmianach.
