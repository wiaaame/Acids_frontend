import axios from "axios";
import {
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from "../modules/authToken";
import { IS_GITHUB_PAGES } from "../modules/deploy";

// На GitHub Pages нет веб-сервиса: авторизация доступна только
// при запуске приложения с бэкендом (локально или через HTTPS-proxy).
const GITHUB_PAGES_DEMO = "GITHUB_PAGES_DEMO";

// Авторизация и деавторизация выполняются ТОЛЬКО через axios:
// без кодогенерации и без redux-thunk, состояние в Redux кладём вручную.
const authClient = axios.create({
  baseURL: "/",
  withCredentials: true,
  timeout: 5000,
});

export interface AuthUser {
  id?: number;
  username: string;
  email?: string;
}

interface LoginResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  current_user?: AuthUser;
  message?: string;
}

const authHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const authApi = {
  // POST /api/users/login → JWT + профиль
  async login(credentials: {
    username: string;
    password: string;
  }): Promise<AuthUser> {
    if (IS_GITHUB_PAGES) {
      throw new Error(GITHUB_PAGES_DEMO);
    }

    const { data } = await authClient.post<LoginResponse>(
      "/api/users/login",
      credentials
    );

    if (!data.access_token) {
      throw new Error("NO_TOKEN");
    }

    setAuthToken(data.access_token);
    return data.current_user ?? { username: credentials.username };
  },

  // POST /api/users/logout — отзыв JWT (blacklist в Redis)
  async logout(): Promise<void> {
    if (IS_GITHUB_PAGES) {
      clearAuthToken();
      return;
    }

    try {
      await authClient.post("/api/users/logout", null, {
        headers: authHeaders(),
      });
    } finally {
      clearAuthToken();
    }
  },
};
