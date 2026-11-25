// Полифилл Web Crypto для Node.js 18 — должен идти ПЕРВЫМ импортом,
// иначе workbox-build упадёт с ошибкой «crypto is not defined».
import "./scripts/crypto-polyfill";

import { createLogger, defineConfig } from "vite";
import type { Plugin, ProxyOptions } from "vite";
import net from "node:net";
import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Адреса бэкенда и объектного хранилища (Silo/MinIO)
const API_HOST = "127.0.0.1";
const API_PORT = 8000;
const S3_HOST = "127.0.0.1";
const S3_PORT = 9000;

// Коды ошибок, означающие «веб-сервис недоступен».
// Для них приложение уже использует локальную коллекцию (mock),
// поэтому стектрейсы в терминале не нужны.
const CONNECTION_ERROR_CODES = [
  "ETIMEDOUT",
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ENOTFOUND",
  "EAI_AGAIN",
];

// Логгер Vite: ошибки прокси из-за недоступного бэкенда заменяем
// одним коротким предупреждением (не чаще раза в 10 секунд).
const logger = createLogger();
const baseError = logger.error.bind(logger);
let lastProxyWarning = 0;

logger.error = (msg, options) => {
  const text = typeof msg === "string" ? msg : String(msg);
  const errorCode = (options as { error?: { code?: string } } | undefined)
    ?.error?.code;

  const isBackendUnavailable =
    text.includes("http proxy error") &&
    CONNECTION_ERROR_CODES.some(
      (code) => text.includes(code) || errorCode === code
    );

  if (!isBackendUnavailable) {
    baseError(msg, options);
    return;
  }

  const now = Date.now();
  if (now - lastProxyWarning > 10_000) {
    lastProxyWarning = now;
    const target = text.split("\n")[0].replace("http proxy error: ", "");
    logger.warn(
      `Веб-сервис недоступен (${target}) — используются локальные данные (mock).`,
      { timestamp: true }
    );
  }
};

// Быстрая проверка «порт слушает?» — без ожидания системного ETIMEDOUT
const PROBE_TIMEOUT = 400;
const PROBE_TTL = 5_000;

const isPortOpen = (host: string, port: number): Promise<boolean> =>
  new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (open: boolean) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(open);
    };

    socket.setTimeout(PROBE_TIMEOUT);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
    socket.connect(port, host);
  });

// Middleware перед прокси: если бэкенд выключен, сразу отдаём 503.
// Клиент моментально переходит на mock, а Vite не пишет простыню ошибок.
const backendGuard = (prefix: string, host: string, port: number): Plugin => {
  let available = false;
  let checkedAt = 0;

  return {
    name: `backend-guard-${prefix.replace("/", "")}`,
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith(prefix)) {
          next();
          return;
        }

        const now = Date.now();
        if (now - checkedAt < PROBE_TTL) {
          if (available) next();
          else respondUnavailable(res);
          return;
        }

        void isPortOpen(host, port).then((open) => {
          available = open;
          checkedAt = Date.now();
          if (open) next();
          else respondUnavailable(res);
        });
      });
    },
  };
};

const respondUnavailable = (res: {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
}) => {
  res.statusCode = 503;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ detail: "Backend unavailable" }));
};

// Прокси с коротким таймаутом на исходящее соединение.
// stripPrefix=true — убрать префикс (для /s3), false — передать путь как есть
// (бэкенд сам обслуживает /api/acids, /api/users/...).
const backendProxy = (
  target: string,
  prefix: string,
  stripPrefix = true
): ProxyOptions => ({
  target,
  changeOrigin: true,
  proxyTimeout: 1500,
  ...(stripPrefix
    ? { rewrite: (path: string) => path.replace(new RegExp(`^${prefix}`), "") }
    : {}),
});

// ===== HTTPS =====
// Сертификаты создаются командой `npm run certs` (mkcert или openssl).
// Каталог certs.local/ попадает под правило *.local и не коммитится.
// Для совместимости с методичкой поддерживаем и каталог certs/.
// Если сертификатов нет — Vite работает по HTTP, а Node.js reverse-proxy
// (server/proxy.mjs) подскажет, что делать.
const certCandidates = [
  path.resolve(process.cwd(), "certs.local"),
  path.resolve(process.cwd(), "certs"),
];
const certsDir =
  certCandidates.find(
    (dir) =>
      fs.existsSync(path.join(dir, "cert.key")) &&
      fs.existsSync(path.join(dir, "cert.crt"))
  ) || certCandidates[0];
const keyPath = path.join(certsDir, "cert.key");
const crtPath = path.join(certsDir, "cert.crt");
const hasHttpsCerts = fs.existsSync(keyPath) && fs.existsSync(crtPath);

const httpsOptions = hasHttpsCerts
  ? {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(crtPath),
    }
  : undefined;

// ===== GitHub Pages =====
// В режиме `pages` приложение собирается с base = /acid_PWA/.
// Имя репозитория можно переопределить: GH_PAGES_BASE=/my-repo/ npm run build:pages
const rawPagesBase = process.env.GH_PAGES_BASE || "/acid_PWA/";
const pagesBase = rawPagesBase.endsWith("/") ? rawPagesBase : `${rawPagesBase}/`;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages отдаёт проект по адресу https://<user>.github.io/<repo>/.
  // Для локальной разработки и HTTPS-proxy base остаётся корнем.
  base: mode === "pages" ? pagesBase : "/",
  plugins: [
    react(),
    backendGuard("/api", API_HOST, API_PORT),
    backendGuard("/s3", S3_HOST, S3_PORT),

    // PWA: manifest.webmanifest + service worker (Workbox).
    // start_url/scope заданы относительно base, поэтому одинаково
    // работают и на localhost, и на GitHub Pages.
    VitePWA({
      registerType: "autoUpdate",
      // Регистрируем SW вручную в src/main.tsx через virtual:pwa-register
      injectRegister: null,
      devOptions: {
        enabled: true,
        type: "module",
      },
      includeAssets: [
        "favicon.svg",
        "apple-touch-icon.png",
        "DefaultImage.svg",
      ],
      manifest: {
        name: "Кислоты и реакции",
        short_name: "Кислоты",
        description:
          "Каталог химических реакций кислот: лента, плитка и добавление услуг",
        lang: "ru",
        start_url: ".",
        scope: ".",
        display: "standalone",
        background_color: "#F5F7FA",
        theme_color: "#1B4F72",
        orientation: "portrait-primary",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest,mp4}"],
        navigateFallback: "index.html",
        // Запросы к API и объектному хранилищу не должны отдавать index.html
        navigateFallbackDenylist: [/^\/api/, /^\/s3/],
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  customLogger: logger,
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    watch: { usePolling: true },
    ...(httpsOptions ? { https: httpsOptions } : {}),
    proxy: {
      // REST API веб-сервиса: браузер обращается к /api/... на своём origin,
      // Vite проксирует запрос на бэкенд — CORS не требуется.
      // Префикс /api НЕ срезается: бэкенд обслуживает пути /api/acids и др.
      "/api": backendProxy(`http://${API_HOST}:${API_PORT}`, "/api", false),
      // Второй маршрут — объектное хранилище Silo (MinIO) для изображений
      // и видео услуг: /s3/acids/photo.png -> http://127.0.0.1:9000/acids/...
      "/s3": backendProxy(`http://${S3_HOST}:${S3_PORT}`, "/s3"),
    },
  },
  // `vite preview` также умеет HTTPS — это удобно для проверки PWA
  // на телефоне без запуска отдельного reverse-proxy.
  preview: {
    port: 4173,
    host: true,
    ...(httpsOptions ? { https: httpsOptions } : {}),
  },
}));
