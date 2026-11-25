// Хранение JWT текущего пользователя.
//
// Приложение передаёт токен в заголовке Authorization: Bearer <JWT>.
// Дополнительно дублируем его в cookie (не HttpOnly), чтобы после F5
// токен был виден во вкладке Application → Cookies — это требуется
// для демонстрации сохранения сессии при сбросе Redux.
const TOKEN_KEY = "acid-redux:jwt";
const COOKIE_NAME = "acid_jwt";
const COOKIE_MAX_AGE = 24 * 60 * 60;

export const getAuthToken = (): string => {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
};

export const setAuthToken = (token: string) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage может быть недоступен — работаем только с cookie
  }

  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
    token
  )}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
};

export const clearAuthToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }

  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
};
