import React from "react";
import { render, screen } from "@testing-library/react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";

import { HashRouter } from "react-router-dom";

test("renders learn react link", () => {
  render(
    <HashRouter>
      <GoogleOAuthProvider clientId="sample">
        <App />
      </GoogleOAuthProvider>
      
    </HashRouter>
  );
});
