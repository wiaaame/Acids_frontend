import { withBase } from "./deploy";

// Приведение адресов объектов Silo (MinIO) к прокси Vite /s3.
//
// Бэкенд может хранить абсолютные ссылки на объектное хранилище,
// например http://127.0.0.1:9000/reactions/photo.png. Браузер должен
// запрашивать их с того же origin, что и приложение, поэтому заменяем
// хост хранилища на /s3 (см. vite.config.ts) — CORS не требуется,
// а в Network видно единый маршрут прокси.
const S3_LOCAL_ORIGIN = /^https?:\/\/(?:localhost|127\.0\.0\.1):9000/i;
const S3_SERVICE_HOST = /^https?:\/\/(?:silo|minio)(?::9000)?/i;

export const toMediaUrl = (url?: string | null): string => {
  if (!url) return "";

  return url
    .replace(S3_LOCAL_ORIGIN, "/s3")
    .replace(S3_SERVICE_HOST, "/s3");
};

// Локальные ассеты из public/ должны учитывать base сборки.
// На GitHub Pages приложение живёт в /acid_PWA/, поэтому
// "/DefaultImage.svg" превращается в "/acid_PWA/DefaultImage.svg".
export const localAsset = (assetPath: string): string => withBase(assetPath);
