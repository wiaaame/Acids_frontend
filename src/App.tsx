import { BrowserRouter, Route, Routes } from "react-router-dom";
import FeedPage from "./pages/FeedPage";
import TilesPage from "./pages/TilesPage";
import { ROUTES } from "./Routes";
import { AppLayout } from "./AppLayout";

// Приложение состоит ровно из двух страниц: «Лента» и «Плитка»
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path={ROUTES.FEED} element={<FeedPage />} />
          <Route path={ROUTES.TILES} element={<TilesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
