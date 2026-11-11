// Маршруты приложения
export const ROUTES = {
  FEED: "/",
  TILES: "/tiles",
  ADD: "/add",
  LOGIN: "/login",
};

export type RouteKeyType = keyof typeof ROUTES;

// Подписи пунктов нижней панели навигации
export const ROUTE_LABELS: { [key in RouteKeyType]: string } = {
  FEED: "Лента",
  TILES: "Плитка",
  ADD: "Добавление",
  LOGIN: "Вход",
};
