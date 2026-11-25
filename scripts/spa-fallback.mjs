// GitHub Pages не умеет отдавать index.html для произвольных путей SPA.
// Копируем dist/index.html в dist/404.html: Pages отдаст его при переходе
// на /acid_PWA/tiles, /acid_PWA/add и другие клиентские маршруты.
// Заодно создаём .nojekyll, чтобы Pages не обрабатывал файлы через Jekyll.
import fs from "node:fs";
import path from "node:path";

const distDir = path.join(process.cwd(), "dist");
const indexFile = path.join(distDir, "index.html");

if (!fs.existsSync(indexFile)) {
  console.error("dist/index.html не найден. Сначала выполните npm run build:pages");
  process.exit(1);
}

fs.copyFileSync(indexFile, path.join(distDir, "404.html"));
fs.writeFileSync(path.join(distDir, ".nojekyll"), "");

console.log("✓ dist/404.html создан (SPA fallback для GitHub Pages)");
console.log("✓ dist/.nojekyll создан");
