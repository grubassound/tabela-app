# Tabela — aplikacja z logowaniem i rolami

Aplikacja webowa wyświetlająca edytowalną tabelę (arkusz), z logowaniem
i trzema rolami użytkowników:

- **Administrator** — zarządza kolumnami tabeli (tekst / liczba / lista wyboru z opcjami)
  i użytkownikami (loginy, hasła, role).
- **Edytor** — może dodawać wiersze i edytować wartości komórek, ale nie ma dostępu
  do ustawień (kolumny, użytkownicy).
- **Przeglądający** — widzi tabelę wyłącznie w trybie odczytu, bez możliwości zmian.

Wszystkie uprawnienia są wymuszane po stronie serwera (nie tylko ukrywane w interfejsie).

## Stos technologiczny

- **Backend:** Node.js + Express
- **Baza danych:** MySQL / MariaDB (korzysta z istniejącej instancji na Twoim serwerze)
- **Sesje logowania:** trzymane w tej samej bazie MySQL (tabela `sessions`, tworzona automatycznie)
- **Hasła:** hashowane przez `bcryptjs`
- **Frontend:** zwykły HTML/CSS/JS bez frameworków, w katalogu `public/`
- **Serwer WWW:** Apache jako reverse proxy przed aplikacją Node.js (opcjonalnie —
  na start można też wejść bezpośrednio po `IP:port`)

---

## 1. Wymagania na serwerze

- Node.js 18+ (sprawdź: `node -v`; jeśli nie masz, patrz sekcja niżej)
- MySQL lub MariaDB już zainstalowane (masz)
- Apache już zainstalowany (masz)

### Instalacja Node.js (jeśli jeszcze nie masz)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v
```

---

## 2. Przygotowanie bazy danych MySQL

Zaloguj się do MySQL na serwerze (jako root lub użytkownik z uprawnieniami do tworzenia baz):

```bash
sudo mysql -u root -p
```

I wykonaj:

```sql
CREATE DATABASE tabela_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'tabela_user'@'localhost' IDENTIFIED BY 'WSTAW-TU-SILNE-HASLO';
GRANT ALL PRIVILEGES ON tabela_app.* TO 'tabela_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Aplikacja sama utworzy potrzebne tabele (`users`, `columns`, `rows`, `cells`, `sessions`)
przy pierwszym uruchomieniu — nie trzeba nic więcej ręcznie zakładać.

---

## 3. Wgranie i konfiguracja aplikacji

```bash
# Sklonuj repozytorium (albo skopiuj pliki na serwer w inny sposób)
git clone https://github.com/grubassound/tabela-app.git
cd tabela-app

# Zainstaluj zależności
npm install --omit=dev

# Skopiuj szablon konfiguracji i uzupełnij dane
cp .env.example .env
nano .env
```

W pliku `.env` uzupełnij:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=tabela_user
DB_PASSWORD=WSTAW-TU-SILNE-HASLO       # to samo, które ustawiłeś w kroku 2
DB_NAME=tabela_app
SESSION_SECRET=WSTAW-LOSOWY-DLUGI-CIAG-ZNAKOW
PORT=3001
```

Losowy sekret sesji możesz wygenerować komendą:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Port `3001` możesz zmienić na dowolny wolny port — upewnij się tylko, że nie koliduje
z Apache (który zwykle zajmuje 80/443) ani z innymi usługami.

---

## 4. Uruchomienie aplikacji

### Szybki test

```bash
npm start
```

Przy pierwszym uruchomieniu w logu zobaczysz:
```
Utworzono domyślnego administratora: admin / admin123 (ZMIEŃ HASŁO PO PIERWSZYM LOGOWANIU!)
Serwer działa na porcie 3001 — http://localhost:3001
```

⚠️ **Koniecznie zmień hasło administratora od razu po pierwszym zalogowaniu** — przycisk
„Zmień hasło” w prawym górnym rogu po zalogowaniu.

### Uruchomienie na stałe (pm2)

Żeby aplikacja działała w tle i wstawała automatycznie po restarcie serwera:

```bash
sudo npm install -g pm2
pm2 start server.js --name tabela-app
pm2 save
pm2 startup      # wykonaj komendę, którą pm2 Ci wypisze
```

Przydatne komendy:
```bash
pm2 status              # sprawdź czy działa
pm2 logs tabela-app     # podgląd logów
pm2 restart tabela-app  # restart po zmianach w kodzie
```

---

## 5. Dostęp — na razie po IP i porcie

Skoro chcesz na start dostęp bezpośrednio po adresie IP serwera i porcie, wystarczy:

1. Otwórz port w firewallu (jeśli używasz `ufw`):
   ```bash
   sudo ufw allow 3001/tcp
   ```
2. Wejdź w przeglądarce na: `http://TWOJE-IP-SERWERA:3001`

To wszystko — Apache w ogóle nie musi być w to zaangażowany na tym etapie, bo Node.js
sam obsługuje ruch HTTP na porcie 3001.

### Gdy zechcesz później podpiąć to pod domenę przez Apache

Kiedy będziesz gotowy na dostęp przez `twojadomena.pl` (albo subdomenę) zamiast IP:port,
Apache może działać jako reverse proxy przed aplikacją Node.js. Włącz potrzebne moduły:

```bash
sudo a2enmod proxy proxy_http
sudo systemctl restart apache2
```

I dodaj VirtualHost (np. `/etc/apache2/sites-available/tabela-app.conf`):

```apache
<VirtualHost *:80>
    ServerName tabela.twojadomena.pl

    ProxyPreserveHost On
    ProxyPass / http://localhost:3001/
    ProxyPassReverse / http://localhost:3001/

    ErrorLog ${APACHE_LOG_DIR}/tabela-app-error.log
    CustomLog ${APACHE_LOG_DIR}/tabela-app-access.log combined
</VirtualHost>
```

```bash
sudo a2ensite tabela-app.conf
sudo systemctl reload apache2
```

Potem warto dorobić HTTPS (Let's Encrypt przez `certbot`), żeby hasła logowania
nie leciały po sieci jawnym tekstem:
```bash
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d tabela.twojadomena.pl
```

Daj znać, jak dojdziesz do tego etapu — pomogę skonfigurować konkretnie pod Twoją domenę.

---

## Struktura projektu

```
tabela-app/
├── server.js           ← serwer Express + API + reguły uprawnień (async, MySQL)
├── database.js          ← pula połączeń MySQL, tworzenie tabel, domyślny admin
├── .env.example          ← szablon konfiguracji (skopiuj jako .env)
├── package.json
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

## Backup danych

Skoro dane są teraz w Twojej instancji MySQL, kopię zapasową rób tak jak dla
reszty swoich baz na tym serwerze, np.:
```bash
mysqldump -u tabela_user -p tabela_app > backup-tabela-app-$(date +%F).sql
```

## Rozszerzenia, o które możesz poprosić

- Historia zmian komórek (kto i kiedy zmienił wartość).
- Sortowanie/filtrowanie kolumn, eksport do CSV/Excel/PDF.
- Możliwość przeciągania i zmiany kolejności kolumn/wierszy.
- Konfiguracja HTTPS i domeny przez Apache (patrz sekcja wyżej).
