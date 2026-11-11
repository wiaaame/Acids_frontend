import React from "react";
import ReactDOM from "react-dom/client";
// Bootstrap должен идти ДО App: иначе его .navbar перебивает
// позиционирование таббара из MobileApp.css
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
