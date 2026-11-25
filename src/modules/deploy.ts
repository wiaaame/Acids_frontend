// Режим развертывания приложения.
//
// GitHub Pages умеет отдавать только статику: веб-сервиса и объектного
// хранилища там нет. Поэтому сборка для Pages (`npm run build:pages`)
// принудительно работает на локальной mock-коллекции, а не пытается
// ходить в /api (иначе каждый запрос получал бы HTML страницы 404).
export const IS_GITHUB_PAGES =
  import.meta.env.MODE === "pages" ||
  (typeof window !== "undefined" &&
    /(^|\.)github\.io$/i.test(window.location.hostname));

// Базовый путь приложения: "/" локально и "/acid_PWA/" на GitHub Pages.
export const APP_BASE = import.meta.env.BASE_URL;

// Добавляет base к пути публичного ассета из каталога public.
// Пример: withBase("DefaultImage.svg") →
//   локально  "/DefaultImage.svg"
//   на Pages  "/acid_PWA/DefaultImage.svg"
export const withBase = (assetPath: string): string => {
  const base = APP_BASE.replace(/\/$/, "");
  const cleanPath = assetPath.replace(/^\//, "");
  return cleanPath ? `${base}/${cleanPath}` : `${base}/`;
};
