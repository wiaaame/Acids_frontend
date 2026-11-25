// Node.js reverse-proxy с HTTPS для запуска собранного приложения.
//
// Что делает сервер:
//   1. Отдаёт статику из dist/ по HTTPS (сертификат из certs/).
//   2. Проксирует /api → веб-сервис (по умолчанию http://127.0.0.1:8000).
//   3. Проксирует /s3  → объектное хранилище Silo/MinIO (http://127.0.0.1:9000),
//      срезая префикс /s3 (как Vite в режиме разработки).
//   4. Для клиентских маршрутов SPA отдаёт index.html.
//
// Запуск:
//   npm run build
//   npm run serve:https
//
// Переменные окружения:
//   PORT=8443            порт HTTPS
//   HOST=0.0.0.0         интерфейс прослушивания
//   API_TARGET=http://127.0.0.1:8000
//   S3_TARGET=http://127.0.0.1:9000
//   CERT_DIR=./certs.local  каталог с cert.key и cert.crt
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT, "dist");

const defaultCertDirs = [
  path.join(ROOT, "certs.local"),
  path.join(ROOT, "certs"),
];
const CERT_DIR = process.env.CERT_DIR
  ? path.resolve(process.env.CERT_DIR)
  : defaultCertDirs.find((dir) =>
      fs.existsSync(path.join(dir, "cert.key"))
    ) || defaultCertDirs[0];
const KEY_FILE = path.join(CERT_DIR, "cert.key");
const CRT_FILE = path.join(CERT_DIR, "cert.crt");

const PORT = Number(process.env.PORT || 8443);
const HOST = process.env.HOST || "0.0.0.0";
const API_TARGET = process.env.API_TARGET || "http://127.0.0.1:8000";
const S3_TARGET = process.env.S3_TARGET || "http://127.0.0.1:9000";

if (!fs.existsSync(KEY_FILE) || !fs.existsSync(CRT_FILE)) {
  console.error(
    [
      "Не найдены сертификаты для HTTPS.",
      `Ожидались файлы: ${KEY_FILE} и ${CRT_FILE}`,
      "Создайте их командой: npm run certs",
    ].join("\n")
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(DIST_DIR, "index.html"))) {
  console.error(
    [
      "Не найдена сборка приложения (dist/index.html).",
      "Сначала выполните: npm run build",
    ].join("\n")
  );
  process.exit(1);
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".txt": "text/plain; charset=utf-8",
};

// Проксирование запроса на вышестоящий сервис.
// stripPrefix — префикс, который нужно убрать из пути (для /s3).
const proxyRequest = (req, res, target, stripPrefix = "") => {
  const targetUrl = new URL(target);
  const client = targetUrl.protocol === "https:" ? https : http;

  let upstreamPath = req.url || "/";
  if (stripPrefix && upstreamPath.startsWith(stripPrefix)) {
    upstreamPath = upstreamPath.slice(stripPrefix.length) || "/";
  }

  const headers = { ...req.headers };
  delete headers.connection;
  delete headers["proxy-connection"];
  headers.host = targetUrl.host;

  const upstream = client.request(
    {
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port || (targetUrl.protocol === "https:" ? 443 : 80),
      method: req.method,
      path: upstreamPath,
      headers,
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    }
  );

  upstream.setTimeout(10_000, () => {
    upstream.destroy(new Error("upstream timeout"));
  });

  upstream.on("error", (error) => {
    if (res.headersSent) {
      res.destroy(error);
      return;
    }
    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    res.end(
      JSON.stringify({
        detail: "Backend unavailable",
        target,
        error: error.message,
      })
    );
  });

  // Тело POST/PUT/PATCH передаём как есть (multipart/form-data в том числе)
  req.pipe(upstream);
};

// Отдача статики из dist с fallback на index.html для SPA-маршрутов.
const serveStatic = (req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD" });
    res.end("Method Not Allowed");
    return;
  }

  const url = new URL(req.url || "/", "https://localhost");
  let pathname = decodeURIComponent(url.pathname);

  let filePath = path.normalize(path.join(DIST_DIR, pathname));

  // Защита от выхода за пределы dist/
  if (!filePath.startsWith(DIST_DIR + path.sep) && filePath !== DIST_DIR) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  const extension = path.extname(filePath).toLowerCase();
  const exists = fs.existsSync(filePath) && fs.statSync(filePath).isFile();

  // SPA fallback: путь без расширения (например /tiles) → index.html.
  // Отсутствующий .js/.png не подменяем HTML-страницей.
  if (!exists && !extension) {
    filePath = path.join(DIST_DIR, "index.html");
  } else if (!exists) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
    return;
  }

  const extensionName = path.extname(filePath).toLowerCase();
  const fileName = path.basename(filePath);
  // index.html, sw.js и manifest нельзя кешировать надолго:
  // иначе браузер не увидит обновление service worker и манифеста.
  const noCache =
    extensionName === ".html" ||
    extensionName === ".webmanifest" ||
    fileName === "sw.js";

  res.writeHead(200, {
    "Content-Type":
      MIME_TYPES[extensionName] || "application/octet-stream",
    "Cache-Control": noCache
      ? "no-cache"
      : "public, max-age=31536000, immutable",
  });

  if (req.method === "HEAD") {
    res.end();
    return;
  }

  fs.createReadStream(filePath).pipe(res);
};

const server = https.createServer(
  {
    key: fs.readFileSync(KEY_FILE),
    cert: fs.readFileSync(CRT_FILE),
  },
  (req, res) => {
    const pathname = (req.url || "/").split("?")[0];

    if (pathname === "/api" || pathname.startsWith("/api/")) {
      proxyRequest(req, res, API_TARGET);
      return;
    }

    if (pathname === "/s3" || pathname.startsWith("/s3/")) {
      proxyRequest(req, res, S3_TARGET, "/s3");
      return;
    }

    serveStatic(req, res);
  }
);

server.listen(PORT, HOST, () => {
  const addresses = Object.values(os.networkInterfaces())
    .flat()
    .filter(Boolean)
    .filter((item) => item.family === "IPv4" && !item.internal)
    .map((item) => item.address);

  console.log(`HTTPS reverse-proxy запущен: https://localhost:${PORT}`);
  for (const address of addresses) {
    console.log(`  телефон в той же сети: https://${address}:${PORT}`);
  }
  console.log(`  /api → ${API_TARGET}`);
  console.log(`  /s3  → ${S3_TARGET} (префикс /s3 срезается)`);
});
