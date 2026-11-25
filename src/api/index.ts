import { getAuthToken } from "../modules/authToken";
import { Api } from "./Api";

// Единый типизированный клиент API (кодогенерация из Swagger).
// Пути в сгенерированном Api.ts уже содержат префикс /api, поэтому
// baseURL "/" оставляет их без изменений: браузер запрашивает
// /api/acids, а Vite проксирует запрос на бэкенд (см. vite.config.ts).
// withCredentials: true — cookie передаются автоматически.
// securityWorker добавляет JWT в Authorization для secure-методов.
export const api = new Api({
  baseURL: "/",
  withCredentials: true,
  // Быстрый переход на mock, если веб-сервис не отвечает
  timeout: 5000,
  securityWorker: () => {
    const token = getAuthToken();
    return token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : undefined;
  },
});
