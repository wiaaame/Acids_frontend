import { BrowserRouter, Route, Routes } from "react-router-dom";
import AddReactionPage from "./pages/AddReactionPage";
import FeedPage from "./pages/FeedPage";
import LoginPage from "./pages/LoginPage";
import TilesPage from "./pages/TilesPage";
import { ROUTES } from "./Routes";
import { AppLayout } from "./AppLayout";

// GitHub Pages отдаёт приложение из подкаталога /acid_PWA/.
// basename из BASE_URL делает Link/navigate независимыми от адреса
// развертывания: локально "/", на Pages "/acid_PWA".
const routerBase = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

// Страницы приложения: лента, плитка, добавление услуги и авторизация
function App() {
  return (
    <BrowserRouter basename={routerBase}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path={ROUTES.FEED} element={<FeedPage />} />
          <Route path={ROUTES.TILES} element={<TilesPage />} />
          <Route path={ROUTES.ADD} element={<AddReactionPage />} />
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
