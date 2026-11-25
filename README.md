# Лабораторные работы №6–7. Интерфейс пользователя в React. Адаптивность, PWA, развёртывание

Веб-приложение **«Кислоты и реакции»**: SPA на React с менеджером состояний Redux Toolkit,
авторизацией по JWT и взаимодействием с Go-веб-сервисом через кодогенерацию Swagger и Axios.
Лабораторная работа №7 добавляет адаптивность, PWA, развёртывание на GitHub Pages и HTTPS.

Приложение показывает каталог химических реакций кислот: полноэкранную ленту, плитку карточек,
пошаговое добавление услуги и вход по логину и паролю. При недоступном бэкенде **гость** видит
mock-коллекцию ([`src/modules/mock.ts`](src/modules/mock.ts:11)), авторизованному пользователю
показывается ошибка загрузки.

## Структура репозитория

```
.
├── public/          # статика: иконки PWA, favicon, DefaultImage.svg
├── screenshots/     # скриншоты лабораторных работ
├── scripts/         # кодогенерация, сертификаты, иконки, SPA-fallback
├── server/          # Node.js HTTPS reverse-proxy для собранного приложения
├── src/             # React SPA (Vite, TypeScript, React-Bootstrap, Redux Toolkit)
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

Бэкенд — отдельный Go-сервис (Gin, GORM, JWT, Redis, MinIO, PostgreSQL), запускается
на `http://localhost:8000`.

## Стек

- React 18, TypeScript, Vite 5
- React-Bootstrap, react-router-dom
- Redux Toolkit, React Redux, Redux Thunk (встроен в Toolkit)
- Axios
- swagger-typescript-api (кодогенерация клиента)
- vite-plugin-pwa, Workbox
- gh-pages
- Go (Gin, GORM, JWT, Redis, MinIO, PostgreSQL) — сторона веб-сервиса

## Запуск

### 1. Бэкенд

```bash
cd /home/wiame/acid_swagger

# PostgreSQL, Redis, Silo/MinIO, Adminer (:8081)
docker compose up -d

# REST API и Swagger
PORT=8000 go run ./cmd/server
```

- Swagger UI: http://localhost:8000/swagger/index.html
- MinIO: http://localhost:9000 (консоль :9001, логин/пароль `minioadmin`)
- Adminer: http://localhost:8081 (PostgreSQL `acids`, `postgres` / `postgres`)
- демо-пользователи: `ivanov`, `petrova`, `sidorov`, пароль `password`

### 2. Фронтенд

```bash
npm install
npm run generate-api   # генерация src/api/Api.ts из Swagger
npm run dev            # http://localhost:3000
```

Кодогенерация берёт спецификацию из `http://localhost:8000/swagger/doc.json`
(адрес переопределяется переменной `API_SCHEMA_URL`, можно передать путь к файлу):

```bash
API_SCHEMA_URL=./swagger.json npm run generate-api
```

Если веб-сервис не запущен, используется уже сгенерированный
[`src/api/Api.ts`](src/api/Api.ts:1).

## Тестовые данные

```bash
# Токен демо-пользователя
TOKEN=$(curl -s -X POST http://localhost:8000/api/users/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"ivanov","password":"password"}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')

# Черновик реакции (multipart/form-data)
curl -X POST http://localhost:8000/api/acids \
  -H "Authorization: Bearer $TOKEN" \
  -F 'reaction_name=Реакция с цинком' \
  -F 'acid_name=Соляная кислота' \
  -F 'molar_mass=36.46' \
  -F 'concentration=10'

# Публикация (id из ответа предыдущего запроса)
curl -X PUT http://localhost:8000/api/acids/1/publish \
  -H "Authorization: Bearer $TOKEN"
```

## Обратный прокси (CORS)

В [`vite.config.ts`](vite.config.ts:255) настроены два маршрута:

| Маршрут | Куда | Назначение |
|---|---|---|
| `/api` | `http://127.0.0.1:8000` | методы веб-сервиса (префикс сохраняется) |
| `/s3` | `http://127.0.0.1:9000` | изображения и видео из MinIO (префикс срезается) |

Браузер обращается только к `localhost:3000`, поэтому ограничение CORS не возникает.
Адреса объектов MinIO (`http://localhost:9000/...`) на фронтенде переписываются
в `/s3/...` функцией `toMediaUrl` ([`src/modules/media.ts`](src/modules/media.ts:13)).

## Redux Toolkit

Store создаётся в [`src/store/index.ts`](src/store/index.ts:8):

```
store
├── reactions  (store/slices/reactionsSlice.ts)
│   ├── items, filters.massRange (0–200 г/моль)
│   ├── loading, saving, error, source
│   └── thunks: fetchReactions, createReaction, fetchDraft,
│              publishReaction, deleteReaction, toggleReactionLike
└── user       (store/slices/userSlice.ts)
    └── username, isAuthenticated, loading, error
```

- Для методов услуг используются `createAsyncThunk` и сгенерированный клиент `api.*`.
- Авторизация и деавторизация выполняются **вручную через axios**, без кодогенерации
  и thunk: после ответа состояние в Redux устанавливается обычными action
  (`setUser`, `clearUser`).
- Redux DevTools включён (`devTools: true`), redux-thunk подключается автоматически.
- Типизированные хуки — `useAppDispatch`, `useAppSelector` ([`src/store/hooks.ts`](src/store/hooks.ts:1)).

## Авторизация и хранение JWT

- JWT сохраняется в `localStorage` под ключом `acid-redux:jwt`
  и дублируется в cookie `acid_jwt` ([`src/modules/authToken.ts`](src/modules/authToken.ts:7)).
- Axios-interceptor (`securityWorker`) подставляет `Authorization: Bearer <token>`
  во все secure-запросы ([`src/api/index.ts`](src/api/index.ts:15)).
- Redux в память не сохраняется: после F5 интерфейс возвращается в состояние гостя,
  а JWT остаётся в `Application → Local Storage` и `Application → Cookies`.
- При выходе JWT удаляется, состояние пользователя очищается, фильтр сбрасывается
  ([`src/AppLayout.tsx`](src/AppLayout.tsx:29)).
- Авторизация выполняется только через axios (`POST /api/users/login`), выход —
  `POST /api/users/logout` ([`src/api/auth.ts`](src/api/auth.ts:40)).

## Mock-данные

Если бэкенд недоступен **и** пользователь не авторизован, thunk'и подставляют
коллекцию `ACID_REACTIONS_MOCK` из [`src/modules/mock.ts`](src/modules/mock.ts:11).
Для авторизованного пользователя ошибка выводится на страницу.
На GitHub Pages (`IS_GITHUB_PAGES`) mock используется всегда, без запросов к `/api`
([`src/modules/deploy.ts`](src/modules/deploy.ts:7)).

## Страница «Добавление» — `/add`

Пошаговая форма создания услуги: сначала черновик с медиа и названием, затем публикация
с описанием и характеристиками.

**Кнопки и поля:**

- **Хедер** — заголовок «Новая кислота»;
- **Превью «Фото»** — при создании черновика кнопка «Выбрать фото» открывает выбор
  изображения и показывает превью; на шаге публикации показывает обложку из черновика;
- **Превью «Видео»** — аналогично открывает выбор видео и показывает превью;
- **Поле «Название кислоты»** — название услуги (`acid_name`), без него черновик не создаётся;
- **Кнопка «Далее»** — создаёт черновик (`createReaction`) и открывает форму публикации;
  блокируется, пока идёт запрос;
- **Поле «Описание»** — текст описания услуги, многострочное;
- **Поле «Молярная масса, г/моль»** — минимум 0, шаг 0.01;
- **Поле «Концентрация, %»** — от 0 до 100, шаг 1;
- **Кнопка «Опубликовать»** — отправляет описание и характеристики (`publishReaction`)
  и после успеха открывает `/tiles`.

Страница доступна только авторизованным: гость перенаправляется на `/login`. При открытии
загружается черновик (`GET /api/acids/draft`); если он уже есть, форма создания пропускается.
Не выбранные файлы в запрос не передаются; при ошибке загрузки `onError` подставляет
`DefaultImage.svg` для фото и `DefaultVideo.mp4` для видео.

## Страница «Лента» — `/`

Полноэкранная карточка услуги в формате TikTok: видео на весь фон, текст поверх него.

**Кнопки и поля:**

- **Название кислоты и формула** — заголовок текущей услуги;
- **Описание** — по умолчанию свёрнуто до двух строк, клик по тексту раскрывает его целиком
  и сворачивает обратно;
- **Чип «М.м.»** — молярная масса (`molar_mass`);
- **Чип «Конц.»** — концентрация в процентах (`concentration`);
- **Иконка «Лайк»** — количество лайков; доступна только авторизованному пользователю;
- **Кнопка «→»** — показывает следующую услугу, список зациклен;
- переход из «Плитки» по `/?id=N` открывает выбранную услугу.

Если у услуги нет видео, подставляется `DefaultVideo.mp4`; при ошибке загрузки видео
заменяется постером `DefaultImage.svg` ([`src/components/FeedItem.tsx`](src/components/FeedItem.tsx:37)).

## Страница «Плитка» — `/tiles`

Список услуг сеткой под шапкой приложения.

**Кнопки и поля:**

- **Хедер** — заголовок «Каталог реакций»;
- **Фильтр по молярной массе** — двойной ползунок (`range`) со шкалой 0–200 г/моль
  и подписью текущего диапазона;
- **Кнопка «Найти»** — применяет фильтр: значения `min`/`max` уходят в
  `GET /api/acids?min=&max=`. Автоматического поиска нет;
- **Карточка услуги** (компонент [`ReactionCard`](src/components/ReactionCard.tsx:22)):
  - изображение — при пустом `image_url` подставляется `DefaultImage.svg`, при ошибке
    загрузки то же значение задаёт `onError`;
  - название кислоты и формула;
  - молярная масса и концентрация;
  - количество лайков (иконка сердца);
  - кнопка «Удалить» — только для своих услуг (`is_mine = 1`);
- **Клик по карточке** — открывает эту услугу на странице «Лента» (`/?id=N`).

В каталоге показываются только опубликованные услуги: черновики и логически удалённые
записи скрыты.

## Страница «Вход» — `/login`

Форма входа по логину и паролю; после успешной авторизации открывается плитка.

**Кнопки и поля:**

- **Хедер** — заголовок «Вход»;
- **Поле «Имя пользователя»** — логин (`username`);
- **Поле «Пароль»** — пароль (`password`), ввод скрыт;
- **Кнопка «Войти»** — отправляет логин и пароль; блокируется, пока идёт запрос;
- **Предупреждение** — при пустых полях выводится «Введите имя пользователя и пароль»,
  при ошибке сервиса — «Неверное имя пользователя или пароль».

Регистрация в интерфейсе отключена: пользователи создаются на стороне веб-сервиса.
На GitHub Pages форма работает в демо-режиме и показывает предупреждение, что вход
доступен только через HTTPS-адрес ноутбука с бэкендом.

## Лабораторная работа №7

### Адаптивность

Корпус приложения и сетка карточек описаны в
[`src/index.css`](src/index.css:51), [`src/MobileApp.css`](src/MobileApp.css:142),
[`src/pages/TilesPage.css`](src/pages/TilesPage.css:99) и
[`src/components/ReactionCard.css`](src/components/ReactionCard.css:25).
Media query меняют только число колонок, ширины и отступы.

| Ширина экрана | Колонки `.tilesGrid` | Фото карточки | Название | Gap |
|---|---|---|---|---|
| `< 360px` | 2: `repeat(2, minmax(0, 1fr))` | 95px | 12px | 8px |
| `360–899px` | 2: `repeat(2, minmax(0, 1fr))` | 95px | 12px | 10px |
| `≥ 900px` | 3: `repeat(3, minmax(0, 1fr))` | 130px | 14px | 16px |
| `≥ 1200px` | 4: `repeat(4, minmax(0, 1fr))` | 150px | 15px | 18px |

- на телефоне (`max-width: 480px`), при небольшой высоте (`max-height: 600px`)
  и в режиме `display-mode: standalone` рамка iPhone убирается — приложение занимает
  весь экран (`100vw × 100dvh`);
- от `900px` корпус превращается в широкий макет: `--frame-w: min(1100px, calc(100vw - 48px))`,
  поэтому сетка получает место для 3–4 колонок;
- **Лента** ([`FeedItem.css`](src/components/FeedItem.css:176)): заголовок 18px → 28px,
  описание 12px → 15px, панель действий 30px → 38px, отступы `44px 92px 16px 12px` → `56px 140px 32px 32px`;
- **Формы** ([`PageForm.css`](src/pages/PageForm.css:220)): на телефоне одна колонка,
  на десктопе форма до 760px, авторизация уже; превью фото и видео встают в ряд
  (`flex-direction: row`);
- на узких экранах (`< 360px`) уменьшаются отступы и шрифты, чтобы интерфейс не «съезжал».

Адаптив покрывает страницы `/`, `/tiles`, `/add` и `/login` (общие контейнеры,
липкий хедер и нижняя панель навигации).

### PWA

PWA настраивается в [`vite.config.ts`](vite.config.ts:192) плагином `VitePWA`:

- `registerType: "autoUpdate"` — новая версия подхватывается автоматически;
- `devOptions.enabled: true` — service worker работает и в режиме разработки;
- собственный `manifest`: name «Кислоты и реакции», `start_url`/`scope` = `.`,
  `display: "standalone"`, иконки 192×192, 512×512 и maskable 512×512
  (`public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/maskable-512x512.png`);
- `workbox.globPatterns` кеширует JS/CSS/HTML/SVG/PNG/MP4;
- `navigateFallback: "index.html"` и `navigateFallbackDenylist: [/^\/api/, /^\/s3/]`
  — офлайн-переходы по клиентским маршрутам работают, а API не подменяется HTML.

Service worker регистрируется вручную в [`src/main.tsx`](src/main.tsx:15):

```ts
import { registerSW } from "virtual:pwa-register";

if ("serviceWorker" in navigator) {
  registerSW({ immediate: true });
}
```

Типы `vite-plugin-pwa/client` добавлены в `compilerOptions.types` файла
[`tsconfig.json`](tsconfig.json:15). Иконки генерируются из SVG командой `npm run icons`
(sharp). Сборка (`npm run build`) кладёт в `dist/`: `manifest.webmanifest`, `sw.js`,
`workbox-*.js` и все файлы из `public/`.

На GitHub Pages работает mock: запрос `/api/...` падает → гость получает `ACID_REACTIONS_MOCK`.

### Развёртывание на GitHub Pages

- в режиме `pages` задаётся `base: '/acid_PWA/'` (переопределяется `GH_PAGES_BASE`)
  в [`vite.config.ts`](vite.config.ts:176);
- basename роутера — `import.meta.env.BASE_URL` ([`src/App.tsx`](src/App.tsx:12));
- пути к файлам из `public/` собираются хелпером `withBase` / `localAsset`
  ([`src/modules/deploy.ts`](src/modules/deploy.ts:19)) — без этого на Pages будет 404;
- [`scripts/spa-fallback.mjs`](scripts/spa-fallback.mjs:1) копирует `dist/index.html`
  в `dist/404.html` и создаёт `.nojekyll`, чтобы прямой переход на `/acid_PWA/tiles`
  не возвращал 404;
- зависимости и скрипт: `gh-pages`, `"deploy": "npm run build:pages && node scripts/spa-fallback.mjs && gh-pages -d dist --dotfiles"`.

Порядок деплоя:

```bash
npm run build:pages    # tsc && vite build --mode pages
npm run deploy         # build:pages + 404.html + публикация dist/ в ветку gh-pages
# GitHub → Settings → Pages → Source: Deploy from branch → ветка gh-pages → Save
# Приложение: https://<username>.github.io/acid_PWA/
```

Если репозиторий называется иначе:

```bash
GH_PAGES_BASE=/my-repo/ npm run build:pages
```

### HTTPS (Node.js reverse-proxy)

Vite dev-сервер — это реверс-прокси (`/api` → `:8000`, `/s3` → `:9000`). Для HTTPS:

```bash
npm run certs          # mkcert, если установлен, иначе openssl
# для доступа с телефона по LAN-IP ноутбука:
EXTRA_HOSTS=192.168.1.10 npm run certs
```

Скрипт [`scripts/generate-certs.mjs`](scripts/generate-certs.mjs:1) создаёт в `certs.local/`:

- `cert.key`, `cert.crt` — для HTTPS-сервера;
- `ca.crt` — корневой сертификат для установки на телефон.

SAN включает `localhost`, `127.0.0.1`, `::1`, все IPv4-адреса машины и адреса из
`EXTRA_HOSTS`. Каталог `certs.local/` попадает под правило `*.local` и не коммитится —
**приватные ключи публиковать нельзя**.

- Vite читает сертификаты и поднимает HTTPS на `:3000`
  (`server.https`, `server.host: true` в [`vite.config.ts`](vite.config.ts:249));
- для собранного приложения используется [`server/proxy.mjs`](server/proxy.mjs:1):
  статика из `dist/`, прокси `/api` и `/s3`, SPA-fallback на `index.html`,
  HTTPS на `:8443`, прослушивание `0.0.0.0`.

```bash
npm run build
npm run serve:https    # https://localhost:8443
# телефон в той же сети: https://<IP-ноутбука>:8443
```

Чтобы телефон доверялся сертификату, установите `ca.crt` на устройство:
Android — **Настройки → Безопасность → Шифрование и учётные данные → Установить сертификат →
Сертификат CA**; iOS — установить профиль и включить полное доверие в
**Настройки → Основные → Об этом устройстве → Доверие сертификатам**.

## Порядок показа (скриншоты, лаба 7)

1. **1–2** — GitHub Pages (mock, гость) на телефоне, установка PWA на главный экран.
2. **3–6** — PWA: применить фильтр по молярной массе на `/tiles`, перейти «Подробнее»
   на ленту, вернуться — значение фильтра старое (Redux переживает SPA-переход).
3. **7** — адаптивный режим браузера, изменение ширины: 2 → 3 → 4 колонки карточек.
4. **8–12** — телефон по IP-адресу ноутбука (HTTPS), вход, три страницы с бэкендом
   (`/`, `/tiles`, `/add`).
5. **13–14** — файлы сертификатов (`ca.crt`, `cert.crt`, `cert.key`) и HTTPS-соединение
   в браузере.
6. **15–17** — код настроек сетки: `repeat(2/3/4, minmax(0, 1fr))`, `height: 95/130/150px`,
   `font-size: 12/14/15px`.

## Проверки

```bash
npm run generate-api   # нужен запущенный бэкенд или API_SCHEMA_URL
npm run build
npm run build:pages
```
