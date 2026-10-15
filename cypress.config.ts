import { defineConfig } from "cypress";
declare let require: any;
declare let process: any;
const dotenv = require("dotenv");

const { exec } = require("child_process");

const shellEnv = { ...process.env };
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.cypress", override: true });
dotenv.config({ path: ".env.cypress.local", override: true });
Object.entries(shellEnv).forEach(([key, value]) => {
  if (value !== undefined) process.env[key] = value;
});

const parseBoolean = (value: string | undefined, defaultValue = false) => {
  if (value === undefined) return defaultValue;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
};

const DEFAULT_BACKEND_URL = "http://localhost:8001";
const DEFAULT_DB_SEED_COMMAND =
  "docker compose --env-file deployment/.env -f deployment/docker-compose.dev.yml --profile seed run --rm mongo-restore";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on("before:browser:launch", (browser: any = {}, launchOptions: any) => {
        if (browser.family === "chromium" && browser.name !== "electron") {
          launchOptions.args.push("--disable-dev-shm-usage");
        }
        return launchOptions;
      });

      on("task", {
        seedDatabase() {
          if (!config.env.resetDb) return null;

          const command = config.env.dbSeedCommand || DEFAULT_DB_SEED_COMMAND;
          return new Promise((resolve, reject) => {
            exec(
              command,
              {
                cwd: __dirname,
                encoding: "utf8",
              },
              (error: any, stdout: string, stderr: string) => {
                if (error) {
                  reject(
                    new Error(
                      [
                        `Database seed command failed with status ${error.code ?? 1}.`,
                        stdout,
                        stderr,
                      ]
                        .filter(Boolean)
                        .join("\n")
                    )
                  );
                  return;
                }

                resolve(stdout || "Database seed completed.");
              }
            );
          });
        },
      });

      return config;
    },
    baseUrl: process.env.CYPRESS_BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
    chromeWebSecurity: false,
    video: true,
    trashAssetsBeforeRuns: true,
  },
  env: {
    googleRefreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    googleClientId: process.env.REACT_APP_GOOGLE_CLIENTID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
    backendURL: process.env.CYPRESS_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || DEFAULT_BACKEND_URL,
    authMode: process.env.CYPRESS_AUTH_MODE || (parseBoolean(process.env.BYPASS_AUTH) ? "disabled" : "mock"),
    team: process.env.CYPRESS_TEAM || process.env.REACT_APP_TEAM || "",
    collaborator: process.env.CYPRESS_COLLABORATOR || process.env.REACT_APP_COLLABORATOR || "isgs",
    useDbSchemas: parseBoolean(process.env.CYPRESS_USE_DB_SCHEMAS ?? process.env.CYPRESS_USE_DB_PROCESSORS),
    useDbProcessors: parseBoolean(process.env.CYPRESS_USE_DB_SCHEMAS ?? process.env.CYPRESS_USE_DB_PROCESSORS),
    resetDb: parseBoolean(process.env.CYPRESS_RESET_DB),
    dbSeedCommand: process.env.CYPRESS_DB_SEED_COMMAND || "",
    BYPASS_AUTH: process.env.BYPASS_AUTH
  },
});
