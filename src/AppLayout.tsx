import { FC, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Navbar, Nav } from "react-bootstrap";
import { ROUTES, ROUTE_LABELS } from "./Routes";
import { AcidReaction } from "./modules/types";
import "./MobileApp.css";

// Данные, передаваемые вложенным страницам через Outlet context
// (не React.createContext — по условию лабораторной он запрещён)
export interface AppOutletContext {
  cards: AcidReaction[];
  setCards: (cards: AcidReaction[]) => void;
}

// Общая обёртка приложения: узкая мобильная колонка + нижняя панель навигации
export const AppLayout: FC = () => {
  const [cards, setCards] = useState<AcidReaction[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="appShell">
      <main className="appContent">
        {/* Dynamic Island — часть корпуса iPhone */}
        <div className="dynamicIsland" />

        <Outlet context={{ cards, setCards }} />

        {/* Нижняя навигационная панель из 4 пунктов. Доступны только Лента и Плитка */}
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
            disabled
            className="tabItem"
            onClick={(e) => e.preventDefault()}
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
          <Nav.Link
            disabled
            className="tabItem"
            onClick={(e) => e.preventDefault()}
          >
            <span className="tabIcon">👤</span>
            {ROUTE_LABELS.LOGIN}
          </Nav.Link>
        </Nav>
      </Navbar>
      </main>
    </div>
  );
};
