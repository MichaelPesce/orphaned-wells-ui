import { defineConfig } from "cypress";
declare let require: any;
declare let process: any;
require("dotenv").config();

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: `http://localhost:${process.env.PORT || 3000}`,
    video: true
  },
  env: {
    googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    googleClientId: process.env.REACT_APP_GOOGLE_CLIENTID,
    googleClientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
    backendURL: process.env.REACT_APP_BACKEND_URL
  },
});