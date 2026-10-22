# Хостинг на GitHub

У проекта две разные вещи, и хостятся они по-разному.

| Что | Где живёт | Можно ли на GitHub Pages |
|---|---|---|
| Классная версия: `server.py`, аккаунты, `/results`, панель учителя | Python-сервер и его данные | **Нет**: Pages отдаёт только статические файлы |
| Публичная версия: `standalone/build`, Pyodide, `localStorage` | статические HTML/JS/WASM | **Да** |

GitHub Pages публикует только `standalone/build`. Там нет `server.py`, аккаунтов,
`/results` и проверки кода на сервере: код выполняется в браузере через Pyodide,
профиль и сейв лежат в `localStorage`.

## Как опубликовано сейчас

Публичная сборка 1.6.1 лежит в ветке `gh-pages`. В настройках Pages выбран
источник **Deploy from a branch** → `gh-pages` / `/ (root)`; workflow для этого
не нужен.

Обновление:

```bash
python tools/build_web.py
python tools/fetch_pyodide.py
```

Затем содержимое `standalone/build/` кладётся в корень `gh-pages` (там должны
быть `index.html`, `game.html` и `.nojekyll`) и ветка пушится. Адрес:

`https://<username>.github.io/<repo>/`

для этого репозитория — `https://jellyfish2077.github.io/Dungeon-of-Python/`.

Если репозиторий **приватный**, GitHub Pages требует платный план (Pro/Team)
или публичный репозиторий. Данные учеников в git не попадают: `results.json`,
`users.json`, `.secret`, `_backup/`, `dist/` и `standalone/build/` в
`.gitignore`. Но исходники при публикации репозитория станут видны.

### Вариант с GitHub Actions (на будущее)

PAT без scope `workflow` не может создавать или менять
`.github/workflows/pages.yml`, поэтому сейчас workflow из `main` убран, а
публикация идёт из `gh-pages`. Если понадобится автоматическая сборка:

1. Выдайте токену scope `workflow` (Settings → Developer settings → Personal
   access tokens).
2. Верните `.github/workflows/pages.yml` из истории git.
3. Переключите Pages Source на **GitHub Actions**.
4. Workflow соберёт `standalone/build`, скачает Pyodide, прогонит
   `verify_web.py` и опубликует artifact.

## Как проверять

После деплоя откройте адрес и пройдите короткий сценарий:

- корень открывает главное меню с шестью пунктами; на фоне плавно
  сменяются подземелья без тумана войны, меню слева, подписей у кнопок и
  логотипа нет;
- «Новая игра» приводит в деревню; страж открывается по E у входа;
- «Профиль», «Об игре» и «Настройки» открываются из списка;
- ESC/«Пауза» открывает паузу: «Продолжить», «Сохранить», «Загрузить»,
  «Настройки», «Выход в Меню»;
- «Сохранить»/«Загрузить» открывают меню сохранений: пустая ячейка пишет,
  у записанной справа скриншот, описание, переименование и удаление;
- «Сохранить» в деревне пишет позицию, «Загрузить» возвращает к ней;
- «Спуститься», один бой, проверка кода 3/3;
- сохранение и загрузка из списка после перезагрузки;
- 390×844: нет горизонтальной прокрутки, кнопки нажимаются;
- консоль без ошибок, запросов к `/api/*` нет.

Быстрая проверка сборки без деплоя:

```bash
python tools/build_web.py
python tools/fetch_pyodide.py
python verify_web.py --browser msedge   # Windows
python verify_web.py                    # Chromium, в том числе в CI
```

Workflow можно запустить вручную: **Actions → Build and deploy web build →
Run workflow**. Он всегда сначала гоняет smoke-тест и только потом публикует.

### Что не проверяется на GitHub

`run_all_checks.py` рассчитан на Windows/WSL: серверные проверки используют
песочницу и локальные особенности. В Actions на Ubuntu запускается только
веб-сборка. Полный прогон и `verify_server` делайте локально:

```bash
python run_all_checks.py
```

## VPS для классной версии

VPS нужен, если ученики заходят из дома или из разных сетей. Для одного класса
в школе проще ноутбук учителя: меньше настроек и данных наружу.

На VPS живёт `server.py`: аккаунты, `/results`, панель учителя и проверка кода.
Публичную статическую сборку при этом можно оставить на GitHub Pages: это
разные приложения.

### Что брать

- **2 vCPU, 2 ГБ RAM, 20 ГБ SSD.** 1 ГБ хватит на 5–8 учеников, но с запасом
  спокойнее: сервер запускает проверку кода и держит несколько воркеров.
- **KVM, а не OpenVZ/LXC.** Для изоляции кода нужны unprivileged user
  namespaces; в контейнерных VPS они часто запрещены.
- **Ubuntu 22.04 LTS или Debian 12.** На Ubuntu 24.04 AppArmor может запрещать
  unprivileged user namespaces, без которых не работает изоляция кода.
- **Домен и A-запись** на IP сервера. Caddy сам получит TLS-сертификат.
- **300–700 ₽/мес:** Timeweb Cloud, Beget, Selectel, REG.RU. Hetzner/Aeza —
  если есть подходящий способ оплаты. Для школы выбирайте регион поближе.

### Сначала проверить sandbox

Сервер запускает код ученика через `unshare` (на Windows — через WSL). На
Linux это непривилегированные namespaces. После создания пользователя
`pyquiz` проверьте:

```bash
sudo -u pyquiz bash -c 'unshare -Urmpf --mount-proc -n true'; echo $?
```

`0` — изоляция работает. Если нет, **не ставьте** `PYQUIZ_SANDBOX=process` на
публичный сервер: это выполнение кода без песочницы. Варианты:

- `PYQUIZ_SANDBOX=wsl` — сервер откажется проверять код, если namespaces нет;
- `--no-code` — проверка кода выключена, задания заменяются другими.

### Установка

```bash
sudo apt update
sudo apt install -y python3 git util-linux bash ufw rsync fail2ban

# Caddy нет в стандартном Ubuntu — поставьте его по официальной инструкции:
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl gnupg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy

sudo useradd --system --user-group --home-dir /opt/pyquiz \
  --shell /usr/sbin/nologin pyquiz
sudo mkdir -p /var/lib/pyquiz
sudo chown pyquiz:pyquiz /var/lib/pyquiz
sudo chmod 700 /var/lib/pyquiz

# Приватный репозиторий — через read-only deploy key и SSH-адрес:
#   git clone git@github.com:JellyFish2077/Dungeon-of-Python.git /opt/pyquiz
# Публичный — обычным HTTPS-clone.
sudo git clone https://github.com/JellyFish2077/Dungeon-of-Python.git /opt/pyquiz
sudo git -C /opt/pyquiz checkout <тег-или-коммит>
```

Скопируйте шаблоны из `deploy/`:

```bash
sudo cp /opt/pyquiz/deploy/pyquiz.env.example /etc/pyquiz.env
sudo nano /etc/pyquiz.env          # PIN и воркеры
sudo chown root:pyquiz /etc/pyquiz.env
sudo chmod 640 /etc/pyquiz.env

sudo cp /opt/pyquiz/deploy/pyquiz.service /etc/systemd/system/pyquiz.service
sudo systemctl daemon-reload
sudo systemctl enable --now pyquiz

sudo cp /opt/pyquiz/deploy/Caddyfile /etc/caddy/Caddyfile
sudo nano /etc/caddy/Caddyfile     # заменить pyquiz.example.ru
# Сначала A-запись домена должна указывать на IP VPS, иначе TLS не выпустится.
sudo systemctl reload caddy

sudo ufw allow OpenSSH
sudo ufw allow 80,443/tcp
sudo ufw enable
```

Порт `8000` наружу не открывайте: сервис слушает `127.0.0.1`, снаружи только
Caddy с HTTPS.

### Проверка после установки

```bash
curl -I https://pyquiz.example.ru/
curl -I https://pyquiz.example.ru/game
sudo systemctl status pyquiz --no-pager
sudo journalctl -u pyquiz -n 40 --no-pager
```

В логе запуска должно быть видно, что изоляция — **локальные namespaces**, а не
`process`. Затем зарегистрируйте тестовый аккаунт, войдите, пройдите один
вопрос с проверкой кода (3/3), откройте `/results?pin=...` и проверьте, что
результат появился.

### Данные и бэкапы

В `/var/lib/pyquiz` лежат `users.json`, `results.json`, `game-config.json`,
`.secret`, `.admin-secret` и `_backup/`. Это единственное, что нужно бэкапить;
код восстанавливается из git.

```bash
sudo tar czf /var/backups/pyquiz-$(date +%F).tgz -C /var/lib pyquiz
```

Ежедневный cron можно положить в `/etc/cron.d/pyquiz-backup`:

```cron
0 3 * * * root tar czf /var/backups/pyquiz-$(date +\%F).tgz -C /var/lib pyquiz
```

Поставьте копию вне сервера. Если копия уходит в облако — шифруйте: в архиве
секреты и имена учеников. Раз в месяц проверяйте восстановление на тестовой
папке.

### Обновления

```bash
sudo tar czf /var/backups/pyquiz-before-update.tgz -C /var/lib pyquiz
sudo git -C /opt/pyquiz fetch --tags
sudo git -C /opt/pyquiz checkout <новый-тег>
sudo systemctl restart pyquiz
```

После рестарта — тот же smoke-тест. Если что-то сломалось, верните предыдущий
тег и восстановите данные.

### Безопасность

- `PYQUIZ_SANDBOX=wsl`, а не `process`; при недоступных namespaces — `--no-code`.
- Сильные `PYQUIZ_TEACHER_PIN` и `PYQUIZ_ADMIN_PIN`; не запускайте с `--dev`.
- Только HTTPS, SSH по ключам, firewall, fail2ban для SSH.
- `/results` защищён PIN; не публикуйте ссылку с PIN.
- Следите за `PYQUIZ_CODE_WORKERS`, диском и логами; обновляйте ОС.
- Помните, что sandbox снижает риск, но не равен полноценной изоляции. См.
  `SECURITY.md`.

### Codespaces и временная VM

Для быстрой проверки классной версии подойдут Codespaces или временная VM:

```bash
python server.py --local --no-code
```

Порт открывается через forwarded URL. Данные эфемерные, для реального урока
с оценками такой вариант не подходит.

### Публичная сборка на том же VPS

Если GitHub Pages не подходит, Caddy может отдать и статическую сборку:

```bash
cd /opt/pyquiz
sudo python3 tools/build_web.py
sudo python3 tools/fetch_pyodide.py
sudo mkdir -p /var/www/pyquiz
sudo rsync -a --delete /opt/pyquiz/standalone/build/ /var/www/pyquiz/
```

И отдельный сайт в Caddy:

```caddyfile
play.example.ru {
    root * /var/www/pyquiz
    file_server
}
```

Но для публичной версии проще GitHub Pages или Itch.io: VPS тогда занят только
классным сервером.

Для Itch.io удобнее готовый архив:
`dist/pydungeon-standalone-<версия>.zip` — загружается как HTML-игра.

## Если что-то не работает

- **404 после деплоя** — Pages Source не «GitHub Actions», workflow упал или
  деплой ещё идёт. Проверьте вкладку Actions и Settings → Pages.
- **Старая версия** — сборка добавляет `?v=<время>` к JS/CSS, но HTML может
  закэшироваться; сделайте hard refresh или добавьте `?v=2` к URL.
- **Пустая страница** — откройте artifact `github-pages` в Actions и проверьте,
  что в корне есть `index.html`, а не папка `build/`.
- **Pyodide не загружается** — workflow должен скачать его локально
  (`tools/fetch_pyodide.py`); без этого сборка тянет CDN.
- **Workflow падает на Playwright** — `python -m playwright install --with-deps
  chromium` уже есть в workflow; смотрите лог шага.
- **Нет Pages в настройках** — приватный репозиторий без Pro либо Pages
  отключён организацией.
