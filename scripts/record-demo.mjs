// Запись короткого демо-ролика интерфейса (mock-режим, как на GitHub Pages).
// Запуск: node scripts/record-demo.mjs
//
// Требуется Playwright и локальный сервер с собранным приложением:
//   npm run build
//   python3 -m http.server 4181 --directory dist
//   node scripts/record-demo.mjs
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.DEMO_URL || "http://localhost:4181/";
const OUTPUT_DIR = path.join(process.cwd(), "screenshots");
const VIDEO_DIR = path.join(OUTPUT_DIR, "video-tmp");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "lab7-demo.webm");

fs.mkdirSync(VIDEO_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  recordVideo: {
    dir: VIDEO_DIR,
    size: { width: 390, height: 844 },
  },
});

const page = await context.newPage();
await page.goto(BASE_URL, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

// Переход на «Плитку»
await page.getByText("Плитка", { exact: true }).click();
await page.waitForTimeout(900);

// Явный поиск по кнопке
await page.getByRole("button", { name: "Найти" }).click();
await page.waitForTimeout(900);

// Меняем верхнюю границу диапазона клавиатурой
const maxThumb = page.locator(".dualRangeInput").nth(1);
await maxThumb.focus();
for (let i = 0; i < 5; i += 1) {
  await page.keyboard.press("PageDown");
  await page.waitForTimeout(150);
}
await page.getByRole("button", { name: "Найти" }).click();
await page.waitForTimeout(900);

// «Подробнее» — первая карточка
await page.getByText("Подробнее").first().click();
await page.waitForTimeout(1300);

// Возврат на «Плитку»: значение фильтра должно сохраниться
await page.getByText("Плитка", { exact: true }).click();
await page.waitForTimeout(1300);

// Показываем страницу входа (регистрации больше нет)
await page.getByText("Вход", { exact: true }).click();
await page.waitForTimeout(1200);

const video = page.video();
await context.close();
await browser.close();

if (video) {
  await video.saveAs(OUTPUT_FILE);
  console.log(`Видео сохранено: ${OUTPUT_FILE}`);
} else {
  console.error("Не удалось получить видео.");
  process.exit(1);
}

fs.rmSync(VIDEO_DIR, { recursive: true, force: true });
