# Tabela — aplikacja z logowaniem i rolami (PHP + Apache + MySQL)

Czysty stos LAMP — **żadnego Node.js, żadnego npm, żadnego kroku budowania**.
Wystarczy skopiować pliki do katalogu serwowanego przez Apache.

Aplikacja webowa wyświetlająca edytowalną tabelę (arkusz), z logowaniem
i trzema rolami użytkowników:

- **Administrator** — zarządza kolumnami tabeli (tekst / liczba / lista wyboru z opcjami)
  i użytkownikami (loginy, hasła, role).
- **Edytor** — może dodawać wiersze i edytować wartości komórek, ale nie ma dostępu
  do ustawień (kolumny, użytkownicy).
- **Przeglądający** — widzi tabelę wyłącznie w trybie odczytu, bez możliwości zmian.

Wszystkie uprawnienia są wymuszane po stronie serwera (PHP), nie tylko ukrywane w interfejsie.

## Stos technologiczny

- **Backend:** czysty PHP (bez frameworków, bez Composera) — PDO do MySQL
- **Baza danych:** MySQL / MariaDB (Twoja istniejąca instancja)
- **Sesje logowania:** natywne sesje PHP (pliki na serwerze)
- **Hasła:** `password_hash()` / `password_verify()` (bcrypt)
- **Frontend:** zwykły HTML/CSS/JS bez frameworków
- **Serwer WWW:** Apache z `mod_php` (lub `php-fpm`, patrz niżej)

---

## 1. Wymagania na serwerze

```bash
sudo apt update
sudo apt install apache2 php libapache2-mod-php php-mysql
```

Sprawdź czy działa:
```bash
php -v
apache2 -v
```

`php-mysql` to rozszerzenie PDO/mysqli — bez niego PHP nie połączy się z Twoją bazą.

---

## 2. Przygotowanie bazy danych MySQL

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE tabela_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'tabela_user'@'localhost' IDENTIFIED BY 'WSTAW-TU-SILNE-HASLO';
GRANT ALL PRIVILEGES ON tabela_app.* TO 'tabela_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Aplikacja sama utworzy potrzebne tabele (`users`, `columns`, `rows`, `cells`)
przy pierwszym żądaniu — nie trzeba nic ręcznie zakładać.

---

## 3. Wgranie plików

```bash
cd /var/www/html
sudo git clone https://github.com/grubassound/tabela-app.git tabela-app
# (albo skopiuj pliki w inny sposób, np. scp / rsync)

cd tabela-app
sudo cp config.php.example config.php
sudo nano config.php
```

W `config.php` uzupełnij dane do bazy (te same, co w kroku 2):

```php
define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'tabela_app');
define('DB_USER', 'tabela_user');
define('DB_PASSWORD', 'WSTAW-TU-SILNE-HASLO');
```

Ustaw właściciela plików na użytkownika Apache:
```bash
sudo chown -R www-data:www-data /var/www/html/tabela-app
```

---

## 4. Konfiguracja Apache

### a) Włącz obsługę `.htaccess` dla katalogu aplikacji

Domyślnie Apache **ignoruje pliki `.htaccess`**, a te w tym projekcie blokują
dostęp z zewnątrz do `config.php` i katalogu `includes/` (gdzie są dane do bazy
i logika łączenia z nią) — **to ważne dla bezpieczeństwa**, więc koniecznie to włącz.

Dodaj do `/etc/apache2/apache2.conf` (albo do konfiguracji swojego VirtualHosta):

```apache
<Directory /var/www/html/tabela-app>
    AllowOverride All
    Require all granted
</Directory>
```

### b) Włącz moduł PHP (zwykle już włączony po instalacji `libapache2-mod-php`)

```bash
sudo a2enmod php8.3    # numer wersji zależny od Twojej instalacji PHP
sudo systemctl restart apache2
```

### c) Jeśli chcesz, żeby aplikacja była dostępna jako osobna strona (VirtualHost)

Utwórz `/etc/apache2/sites-available/tabela-app.conf`:

```apache
<VirtualHost *:80>
    ServerName tabela.twojadomena.pl
    DocumentRoot /var/www/html/tabela-app

    <Directory /var/www/html/tabela-app>
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/tabela-app-error.log
    CustomLog ${APACHE_LOG_DIR}/tabela-app-access.log combined
</VirtualHost>
```

```bash
sudo a2ensite tabela-app.conf
sudo systemctl reload apache2
```

### d) Jeśli chcesz na razie dostęp tylko po IP (bez domeny)

Nic dodatkowego nie musisz robić — jeśli pliki leżą w `/var/www/html/tabela-app`
i masz włączone `AllowOverride All` jak w punkcie (a), aplikacja jest już dostępna pod:

```
http://TWOJE-IP-SERWERA/tabela-app/login.html
```

(Apache domyślnie nasłuchuje na porcie 80, więc port nie jest nawet potrzebny w adresie.)

---

## 5. Pierwsze uruchomienie

Wejdź w przeglądarce na `login.html` (np. `http://TWOJE-IP/tabela-app/login.html`).

Domyślny administrator (tworzony automatycznie przy pierwszym żądaniu):
- **login:** `admin`
- **hasło:** `admin123`

⚠️ **Koniecznie zmień to hasło od razu po pierwszym zalogowaniu** — przycisk
„Zmień hasło” w prawym górnym rogu po zalogowaniu.

---

## Struktura projektu

```
tabela-app/
├── config.php.example    ← szablon konfiguracji (skopiuj jako config.php)
├── .htaccess               ← blokuje dostęp do config.php z zewnątrz
├── includes/
│   ├── .htaccess            ← blokuje CAŁY katalog z zewnątrz
│   ├── db.php                 ← połączenie PDO + tworzenie tabel
│   ├── auth.php                ← funkcje pomocnicze (sesje, JSON, uprawnienia)
│   └── bootstrap.php            ← dołączany na starcie każdego pliku w api/
├── api/
│   ├── login.php     (POST)
│   ├── logout.php    (POST)
│   ├── me.php         (GET, PUT — zmiana hasła)
│   ├── table.php       (GET)
│   ├── rows.php         (POST, DELETE ?id=)
│   ├── cells.php          (PUT)
│   ├── columns.php         (POST, PUT ?id=, DELETE ?id=)
│   └── users.php            (GET, POST, PUT ?id=, DELETE ?id=)
├── login.html
├── index.html          ← widok tabeli
├── admin.html            ← panel administratora
├── css/style.css
└── js/{login,app,admin}.js
```

## Bezpieczeństwo — o czym pamiętać

- **`config.php` zawiera hasło do bazy danych** — nigdy nie commituj go do gita
  (jest w `.gitignore`) i upewnij się, że `.htaccess` faktycznie blokuje do niego
  dostęp (patrz punkt 4a — bez `AllowOverride All` `.htaccess` nic nie da).
- Docelowo warto dołożyć **HTTPS** (Let's Encrypt / certbot), żeby hasła logowania
  nie leciały po sieci jawnym tekstem:
  ```bash
  sudo apt install certbot python3-certbot-apache
  sudo certbot --apache -d tabela.twojadomena.pl
  ```
  Po włączeniu HTTPS ustaw w `config.php`:
  ```php
  define('SESSION_SECURE_COOKIE', true);
  ```

## Backup danych

```bash
mysqldump -u tabela_user -p tabela_app > backup-tabela-app-$(date +%F).sql
```

## Rozszerzenia, o które możesz poprosić

- Historia zmian komórek (kto i kiedy zmienił wartość).
- Sortowanie/filtrowanie kolumn, eksport do CSV/Excel/PDF.
- Możliwość przeciągania i zmiany kolejności kolumn/wierszy.
- Konfiguracja HTTPS i domeny pod konkretny adres, który wybierzesz.
