import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { brand } from "./brand";
import "./index.css";

document.title = `${brand.name} Admin`;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
