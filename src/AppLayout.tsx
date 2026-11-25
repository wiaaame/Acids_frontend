import { FC, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Navbar, Nav } from "react-bootstrap";
import { LOGOUT_LABEL, ROUTES, ROUTE_LABELS } from "./Routes";
import { authApi } from "./api/auth";
import LoadingOverlay from "./components/LoadingOverlay";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import {
  fetchReactions,
  resetFilters,
} from "./store/slices/reactionsSlice";
import { clearUser } from "./store/slices/userSlice";
import "./MobileApp.css";

// Общая обёртка приложения: узкая мобильная колонка + нижняя панель навигации.
// Здесь же переключается интерфейс гостя и авторизованного пользователя.
export const AppLayout: FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const username = useAppSelector((state) => state.user.username);
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);

  // Блокировка интерфейса на время запроса деавторизации
  const [loggingOut, setLoggingOut] = useState(false);

  // Выход: axios-запрос, затем вручную чистим Redux и сбрасываем фильтры
  const handleExit = async () => {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // даже если бэкенд недоступен, возвращаем интерфейс гостя
    } finally {
      dispatch(clearUser());
      // При выходе фильтр пользователя сбрасывается
      dispatch(resetFilters());
      setLoggingOut(false);
      navigate(ROUTES.TILES);
      // Показываем гостевой список (при недоступном бэкенде — mock)
      dispatch(fetchReactions());
    }
  };

  // Пункт «Добавление»: гостя отправляем на страницу входа
  const handleAdd = () => {
    navigate(isAuthenticated ? ROUTES.ADD : ROUTES.LOGIN);
  };

  return (
    <div className="appShell">
      <main className="appContent">
        {/* Dynamic Island — часть корпуса iPhone */}
        <div className="dynamicIsland" />

        <Outlet />

        {/* Нижняя навигационная панель из 4 пунктов */}
        <Navbar className="appTabBar">
          <Nav className="w-100 d-flex">
            <Nav.Link
              className={`tabItem ${
                location.pathname === ROUTES.FEED ? "tabItemActive" : ""
              }`}
              onClick={() => navigate(ROUTES.FEED)}
            >
              <span className="tabIcon">☰</span>
              {ROUTE_LABELS.FEED}
            </Nav.Link>

            <Nav.Link
              className={`tabItem ${
                location.pathname === ROUTES.ADD ? "tabItemActive" : ""
              }`}
              onClick={handleAdd}
            >
              <span className="tabIcon">＋</span>
              {ROUTE_LABELS.ADD}
            </Nav.Link>

            <Nav.Link
              className={`tabItem ${
                location.pathname === ROUTES.TILES ? "tabItemActive" : ""
              }`}
              onClick={() => navigate(ROUTES.TILES)}
            >
              <span className="tabIcon">▦</span>
              {ROUTE_LABELS.TILES}
            </Nav.Link>

            {/* Вход для гостя / Выход и имя пользователя после авторизации */}
            {isAuthenticated ? (
              <Nav.Link
                className="tabItem"
                onClick={handleExit}
                disabled={loggingOut}
              >
                <span className="tabIcon">👤</span>
                <span className="tabUser">{username}</span>
                {LOGOUT_LABEL}
              </Nav.Link>
            ) : (
              <Nav.Link
                className={`tabItem ${
                  location.pathname === ROUTES.LOGIN ? "tabItemActive" : ""
                }`}
                onClick={() => navigate(ROUTES.LOGIN)}
              >
                <span className="tabIcon">👤</span>
                {ROUTE_LABELS.LOGIN}
              </Nav.Link>
            )}
          </Nav>
        </Navbar>

        <LoadingOverlay show={loggingOut} text="Выход..." />
      </main>
    </div>
  );
};
