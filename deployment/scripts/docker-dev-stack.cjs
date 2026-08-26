#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  createStorageCredentialOverrideFile,
} = require("./docker-storage-credentials.cjs");

const scriptDir = __dirname;
const deploymentDir = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(deploymentDir, "..");
const envFile = path.join(deploymentDir, ".env");
const envExampleFile = path.join(deploymentDir, ".env.example");

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
  console.error("Usage: node deployment/scripts/docker-dev-stack.cjs <start|stop|down|clean> [docker compose args]");
  process.exit(1);
}

console.log(`${action.description}...`);

const activeEnvFile = prepareEnvFile(action.createEnvFile);
const parsedEnv = parseEnvFile(activeEnvFile);
const childEnv = { ...parsedEnv, ...process.env };

const backendDir = childEnv.BACKEND_DIR || "../../orphaned-wells-ui-server";
const backendMode = childEnv.BACKEND_MODE || "auto";
const backendGitUrl =
  childEnv.BACKEND_GIT_URL ||
  "https://github.com/CATALOG-Historic-Records/orphaned-wells-ui-server.git";
const backendAutoClone = childEnv.BACKEND_AUTO_CLONE || "false";
const backendPath = path.isAbsolute(backendDir)
  ? backendDir
  : path.resolve(deploymentDir, backendDir);

if (backendAutoClone === "true" && !hasBackendSource(backendPath)) {
  console.log(`Cloning backend repository into ${backendPath}...`);
  fs.mkdirSync(path.dirname(backendPath), { recursive: true });
  runCommand("git", ["clone", backendGitUrl, backendPath], childEnv);
}

const composeFiles = [path.join(deploymentDir, "docker-compose.dev.yml")];

switch (backendMode) {
  case "source":
    if (!hasBackendSource(backendPath)) {
      console.error(`BACKEND_MODE=source requires backend source at ${backendPath}`);
      process.exit(1);
    }
    composeFiles.push(path.join(deploymentDir, "docker-compose.source.yml"));
    console.log(`Using local backend source at ${backendPath}`);
    break;
  case "image":
    console.log("Using backend image from BACKEND_IMAGE");
    break;
  case "auto":
    if (hasBackendSource(backendPath)) {
      composeFiles.push(path.join(deploymentDir, "docker-compose.source.yml"));
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

const credentialOverrideFile =
  actionName === "start"
    ? createStorageCredentialOverrideFile(childEnv, deploymentDir, backendPath)
    : null;
if (credentialOverrideFile) {
  composeFiles.push(credentialOverrideFile);
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

function hasBackendSource(directory) {
  return (
    fs.existsSync(path.join(directory, "deployment", "dockerfile")) &&
    fs.existsSync(path.join(directory, "ogrre", "main.py"))
  );
}

function runCommand(command, args, env) {
  console.log(`Running: ${command} ${args.map(formatArg).join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: repoRoot,
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
