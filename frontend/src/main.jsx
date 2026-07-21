import { StrictMode } from "react";

import { createRoot } from "react-dom/client";

import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "./features/auth/AuthContext";

import AuthInterceptor from "./features/auth/AuthInterceptor";

import AppToaster from "./components/feedback/AppToaster";

import App from "./App";

import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AuthInterceptor />

        <App />
      </AuthProvider>

      <AppToaster />
    </BrowserRouter>
  </StrictMode>,
);
