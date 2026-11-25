import "./PageForm.css";
import { ChangeEvent, FC, FormEvent, useState } from "react";
import { Alert, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import LoadingOverlay from "../components/LoadingOverlay";
import { IS_GITHUB_PAGES } from "../modules/deploy";
import { ROUTES } from "../Routes";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchReactions } from "../store/slices/reactionsSlice";
import {
  setAuthError,
  setAuthLoading,
  setUser,
} from "../store/slices/userSlice";

interface FormState {
  username: string;
  password: string;
}

const initialForm: FormState = {
  username: "",
  password: "",
};

// Страница входа. Регистрация в приложении отключена:
// пользователи создаются на стороне веб-сервиса.
// Запросы — ТОЛЬКО axios (src/api/auth.ts), без кодогенерации и thunk;
// результат вручную кладём в Redux через dispatch(setUser(...)).
const LoginPage: FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { error, loading } = useAppSelector((state) => state.user);
  const [formData, setFormData] = useState<FormState>(initialForm);

  // На GitHub Pages бэкенда нет — авторизация недоступна.
  const demoMode = IS_GITHUB_PAGES;

  // Обработчик изменения полей ввода
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Обработчик отправки формы входа
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (demoMode) {
      dispatch(
        setAuthError(
          "На GitHub Pages доступен только просмотр mock-данных. Для входа откройте приложение по HTTPS-адресу ноутбука."
        )
      );
      return;
    }

    const username = formData.username.trim();
    const password = formData.password;

    if (!username || !password) {
      dispatch(setAuthError("Введите имя пользователя и пароль"));
      return;
    }

    dispatch(setAuthLoading(true));
    dispatch(setAuthError(null));

    try {
      const user = await authApi.login({ username, password });

      // Вручную обновляем состояние интерфейса в Redux
      dispatch(setUser(user.username));

      // После входа данные берём из веб-сервиса
      dispatch(fetchReactions());

      navigate(ROUTES.TILES);
    } catch (err) {
      const code = err instanceof Error ? err.message : "";

      if (code === "GITHUB_PAGES_DEMO") {
        dispatch(
          setAuthError(
            "Демо-режим GitHub Pages: вход доступен только с бэкендом"
          )
        );
      } else {
        dispatch(setAuthError("Неверное имя пользователя или пароль"));
      }
    }
  };

  return (
    <div className="formPage authPage">
      <div className="authHeader">
        <div className="authLogo" aria-hidden="true">
          {/* Колба с пузырьками — символ кислот и реакций */}
          <svg
            className="authLogoIcon"
            viewBox="0 0 24 24"
            width="30"
            height="30"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 3h6" />
            <path d="M10 3v6l-5 8a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-8V3" />
            <path d="M7.5 14h9" />
            <circle cx="10" cy="17" r="0.9" fill="currentColor" stroke="none" />
            <circle cx="13.5" cy="18.5" r="0.7" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <h1 className="formTitle authTitle">Вход</h1>
      </div>

      {demoMode && (
        <Alert variant="info" className="formError">
          GitHub Pages: демо-режим (mock). Авторизация и изменение данных
          работают только через HTTPS-адрес ноутбука с бэкендом.
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="formError">
          {error}
        </Alert>
      )}

      <Form className="authForm" onSubmit={handleSubmit}>
        <Form.Group className="formGroup" controlId="username">
          <Form.Label className="formLabel">Имя пользователя</Form.Label>
          <Form.Control
            className="formControl"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Введите имя пользователя"
            autoComplete="username"
            disabled={loading}
          />
        </Form.Group>

        <Form.Group className="formGroup" controlId="password">
          <Form.Label className="formLabel">Пароль</Form.Label>
          <Form.Control
            className="formControl"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Введите пароль"
            autoComplete="current-password"
            disabled={loading}
          />
        </Form.Group>

        <Button
          className="formSubmit loginSubmit"
          type="submit"
          disabled={loading || demoMode}
        >
          Войти
        </Button>
      </Form>

      <LoadingOverlay show={loading} text="Вход..." />
    </div>
  );
};

export default LoginPage;
