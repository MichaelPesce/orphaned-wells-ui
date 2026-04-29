#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const scriptDir = __dirname;
const envFile = path.join(scriptDir, ".env");
const envExampleFile = path.join(scriptDir, ".env.example");

const actions = {
  start: {
    description: "Start the development Docker stack",
    composeArgs: ["up", "-d", "--build"],
    createEnvFile: true,
    validateBackendMode: true,
  },
  stop: {
    description: "Stop development Docker stack containers",
    composeArgs: ["stop"],
    createEnvFile: false,
    validateBackendMode: false,
  },
  down: {
    description: "Stop and remove development Docker stack containers",
    composeArgs: ["down"],
    createEnvFile: false,
    validateBackendMode: false,
  },
  clean: {
    description: "Stop and remove development Docker stack containers and volumes",
    composeArgs: ["down", "-v", "--remove-orphans"],
    createEnvFile: false,
    validateBackendMode: false,
  },
};

const [actionName, ...extraArgs] = process.argv.slice(2);
const action = actions[actionName];

if (!action) {
  console.error("Usage: node deployment/docker-dev-stack.cjs <start|stop|down|clean> [docker compose args]");
  process.exit(1);
}

console.log(`${action.description}...`);

const activeEnvFile = prepareEnvFile(action.createEnvFile);
const parsedEnv = parseEnvFile(activeEnvFile);
const childEnv = { ...process.env, ...parsedEnv };

const backendDir = parsedEnv.BACKEND_DIR || "../../orphaned-wells-ui-server";
const backendMode = parsedEnv.BACKEND_MODE || "auto";
const backendGitUrl =
  parsedEnv.BACKEND_GIT_URL ||
  "https://github.com/CATALOG-Historic-Records/orphaned-wells-ui-server.git";
const backendAutoClone = parsedEnv.BACKEND_AUTO_CLONE || "false";
const backendPath = path.isAbsolute(backendDir)
  ? backendDir
  : path.resolve(scriptDir, backendDir);

if (backendAutoClone === "true" && !hasGitCheckout(backendPath)) {
  console.log(`Cloning backend repository into ${backendPath}...`);
  fs.mkdirSync(path.dirname(backendPath), { recursive: true });
  runCommand("git", ["clone", backendGitUrl, backendPath], childEnv);
}

const composeFiles = [path.join(scriptDir, "docker-compose.dev.yml")];

switch (backendMode) {
  case "source":
    if (!hasGitCheckout(backendPath)) {
      console.error(`BACKEND_MODE=source requires a backend checkout at ${backendPath}`);
      process.exit(1);
    }
    composeFiles.push(path.join(scriptDir, "docker-compose.source.yml"));
    console.log(`Using local backend source at ${backendPath}`);
    break;
  case "image":
    console.log("Using backend image from BACKEND_IMAGE");
    break;
  case "auto":
    if (hasGitCheckout(backendPath)) {
      composeFiles.push(path.join(scriptDir, "docker-compose.source.yml"));
      console.log(`Using local backend source at ${backendPath}`);
    } else {
      console.log("Using backend image from BACKEND_IMAGE");
    }
    break;
  default:
    if (action.validateBackendMode) {
      console.error(`Invalid BACKEND_MODE='${backendMode}'. Use auto, image, or source.`);
      process.exit(1);
    }
    console.log(`Ignoring unrecognized BACKEND_MODE='${backendMode}' for ${actionName}`);
}

const composeArgs = ["compose", "--env-file", activeEnvFile];
for (const composeFile of composeFiles) {
  composeArgs.push("-f", composeFile);
}
composeArgs.push(...action.composeArgs, ...extraArgs);

runCommand("docker", composeArgs, childEnv);

function prepareEnvFile(shouldCreate) {
  if (fs.existsSync(envFile)) {
    return envFile;
  }

  if (shouldCreate) {
    fs.copyFileSync(envExampleFile, envFile);
    console.log(`Created ${envFile} from .env.example`);
    return envFile;
  }

  return envExampleFile;
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

function hasGitCheckout(directory) {
  return fs.existsSync(path.join(directory, ".git"));
}

function runCommand(command, args, env) {
  console.log(`Running: ${command} ${args.map(formatArg).join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: path.resolve(scriptDir, ".."),
    env,
    stdio: "inherit",
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  process.exitCode = result.status ?? 1;
  if (process.exitCode !== 0) {
    process.exit(process.exitCode);
  }
}

function formatArg(arg) {
  return /\s/.test(arg) ? JSON.stringify(arg) : arg;
}
