import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { brand } from "./brand";
import "./index.css";
import { LocalizationProvider } from "./locales";

document.title = brand.name;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <LocalizationProvider>
      <App />
    </LocalizationProvider>
  </React.StrictMode>,
);
