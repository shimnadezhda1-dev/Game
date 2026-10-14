import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { installAppLifecycle } from "./utils/appLifecycle";
import "./styles.css";

installAppLifecycle();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
