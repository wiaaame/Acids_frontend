// Генерация PNG-иконок PWA из SVG-исходников.
// Запуск: npm run icons
//
// sharp рендерит SVG в PNG нужного размера. Иконки попадают в public/,
// поэтому Vite копирует их в dist и они доступны по относительным путям
// из manifest.webmanifest (работает и на GitHub Pages).
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const publicDir = path.join(process.cwd(), "public");

const iconSvg = fs.readFileSync(path.join(publicDir, "icon-source.svg"));
const maskableSvg = fs.readFileSync(path.join(publicDir, "maskable-source.svg"));

const jobs = [
  { input: iconSvg, size: 192, name: "pwa-192x192.png" },
  { input: iconSvg, size: 512, name: "pwa-512x512.png" },
  { input: maskableSvg, size: 512, name: "maskable-512x512.png" },
  { input: iconSvg, size: 180, name: "apple-touch-icon.png" },
  { input: iconSvg, size: 32, name: "favicon-32x32.png" },
];

for (const job of jobs) {
  const output = path.join(publicDir, job.name);
  await sharp(job.input, { density: 384 })
    .resize(job.size, job.size, { fit: "cover" })
    .png({ compressionLevel: 9 })
    .toFile(output);
  console.log(`✓ ${job.name} (${job.size}×${job.size})`);
}

console.log("Иконки PWA готовы.");
