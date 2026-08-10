#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const envFile = path.join(__dirname, ".env.e2e");
const envExampleFile = path.join(__dirname, ".env.e2e.example");
const cypressBin = path.join(
  repoRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "cypress.cmd" : "cypress"
);

const commands = {
  open: ["open"],
  run: ["run"],
  full: ["run"],
  ci: ["run", "--browser", "chrome"],
  smoke: ["run", "--spec", "cypress/e2e/smoke.cy.js,cypress/e2e/auth-gates.cy.js"],
};

const [commandName = "full", ...extraArgs] = process.argv.slice(2);
const cypressArgs = commands[commandName];

if (!cypressArgs) {
  console.error("Usage: node deployment/scripts/run-cypress-e2e.cjs <open|run|full|ci|smoke> [cypress args]");
  process.exit(1);
}

if (!fs.existsSync(cypressBin)) {
  console.error("Cypress binary not found. Run npm install before running E2E tests.");
  process.exit(1);
}

const e2eEnvFile = fs.existsSync(envFile) ? envFile : envExampleFile;
const e2eEnv = parseEnvFile(e2eEnvFile);
const childEnv = { ...process.env };

setDefault("CYPRESS_BASE_URL", `http://localhost:${e2eEnv.FRONTEND_HOST_PORT || "3001"}`);
setDefault("CYPRESS_BACKEND_URL", `http://localhost:${e2eEnv.BACKEND_HOST_PORT || "8002"}`);
setDefault("CYPRESS_AUTH_MODE", "disabled");
setDefault("CYPRESS_COLLABORATOR", e2eEnv.REACT_APP_COLLABORATOR || e2eEnv.COLLABORATOR || "isgs");
setDefault("CYPRESS_RESET_DB", "true");
setDefault("CYPRESS_DB_SEED_COMMAND", "node deployment/scripts/docker-e2e-stack.cjs seed");

console.log(`Using Cypress base URL: ${childEnv.CYPRESS_BASE_URL}`);
console.log(`Using Cypress backend URL: ${childEnv.CYPRESS_BACKEND_URL}`);
console.log(`Using Cypress collaborator: ${childEnv.CYPRESS_COLLABORATOR}`);
console.log(`Using Cypress DB reset: ${childEnv.CYPRESS_RESET_DB}`);

const result = spawnSync(cypressBin, [...cypressArgs, ...extraArgs], {
  cwd: repoRoot,
  env: childEnv,
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);

function setDefault(key, value) {
  if (!childEnv[key] && value !== undefined && value !== null) {
    childEnv[key] = String(value);
  }
}

function parseEnvFile(filePath) {
  const env = {};
  const contents = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const assignment = line.startsWith("export ") ? line.slice("export ".length).trim() : line;
    const separatorIndex = assignment.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = assignment.slice(0, separatorIndex).trim();
    let value = assignment.slice(separatorIndex + 1).trim();

    if (!key) {
      continue;
    }

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}
