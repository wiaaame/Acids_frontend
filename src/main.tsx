import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { registerSW } from "virtual:pwa-register";
// Bootstrap должен идти ДО App: иначе его .navbar перебивает
// позиционирование таббара из MobileApp.css
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import App from "./App.tsx";
import { store } from "./store";

// Регистрируем service worker из vite-plugin-pwa.
// registerType: "autoUpdate" (vite.config.ts) сам обновляет кеш,
// а приложение продолжает работать офлайн после установки PWA.
if ("serviceWorker" in navigator) {
  registerSW({ immediate: true });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
