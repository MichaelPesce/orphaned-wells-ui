import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { UserContextProvider } from "./usercontext";

// Remove legacy token storage keys from the pre-cookie auth flow.
localStorage.removeItem("id_token");
localStorage.removeItem("access_token");
localStorage.removeItem("refresh_token");

const defaultFetch = window.fetch.bind(window);
const getCookieValue = (name: string): string | null => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const headers = new Headers(init?.headers || undefined);
  // Cookie sessions are authoritative; strip legacy bearer token headers.
  if (headers.has("Authorization")) {
    headers.delete("Authorization");
  }
  const method = (init?.method || "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = getCookieValue("ogrre_csrf");
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }
  }
  return defaultFetch(input, {
    ...init,
    credentials: "include",
    headers,
  });
};

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <BrowserRouter>
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENTID || ""}>
      <UserContextProvider>
        <App />
      </UserContextProvider>
    </GoogleOAuthProvider>
  </BrowserRouter>
);

reportWebVitals();
