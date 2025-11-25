import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { UserContextProvider } from "./usercontext";

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
