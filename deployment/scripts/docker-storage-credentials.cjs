const fs = require("fs");
const os = require("os");
const path = require("path");

function createStorageCredentialOverrideFile(env, deploymentDir, backendPath) {
  const credentialMounts = [];
  const storageBackend = (env.STORAGE_BACKEND || "local").toLowerCase();
  const documentAiBackend = (env.DOCUMENT_AI_BACKEND || "google").toLowerCase();

  if (storageBackend === "google") {
    const storageServiceKey = env.STORAGE_SERVICE_KEY;
    if (!storageServiceKey) {
      console.error("STORAGE_BACKEND=google requires STORAGE_SERVICE_KEY to be set.");
      process.exit(1);
    }
    addCredentialMount(credentialMounts, {
      envName: "STORAGE_SERVICE_KEY",
      serviceKey: storageServiceKey,
      containerPrefix: "/tmp/ogrre-storage-key-",
      label: "Google storage service key",
      deploymentDir,
      backendPath,
    });
  }

  if (documentAiBackend === "google" && env.DOCUMENT_AI_SERVICE_KEY) {
    addCredentialMount(credentialMounts, {
      envName: "DOCUMENT_AI_SERVICE_KEY",
      serviceKey: env.DOCUMENT_AI_SERVICE_KEY,
      containerPrefix: "/tmp/ogrre-document-ai-key-",
      label: "Google Document AI service key",
      deploymentDir,
      backendPath,
    });
  }

  if (credentialMounts.length === 0) {
    return null;
  }

  const overrideDir = fs.mkdtempSync(path.join(os.tmpdir(), "ogrre-compose-"));
  const overrideFile = path.join(overrideDir, "storage-credentials.yml");
  const lines = ["services:", "  backend:", "    environment:"];

  for (const mount of credentialMounts) {
    lines.push(`      ${mount.envName}: ${quoteYamlString(mount.containerPath)}`);
  }

  lines.push("    volumes:");
  for (const mount of credentialMounts) {
    lines.push(
      "      - type: bind",
      `        source: ${quoteYamlString(mount.hostPath)}`,
      `        target: ${quoteYamlString(mount.containerPath)}`,
      "        read_only: true"
    );
  }
  lines.push("");

  fs.writeFileSync(overrideFile, lines.join("\n"));
  for (const mount of credentialMounts) {
    console.log(`Mounting ${mount.label} into ${mount.containerPath}`);
  }
  return overrideFile;
}

function addCredentialMount(mounts, options) {
  const hostPath = resolveServiceKeyHostPath(
    options.envName,
    options.serviceKey,
    options.deploymentDir,
    options.backendPath
  );
  const keyFilename = path.basename(options.serviceKey);
  if (!keyFilename || keyFilename === "." || keyFilename === "..") {
    console.error(`Invalid ${options.envName} path: ${options.serviceKey}`);
    process.exit(1);
  }

  mounts.push({
    envName: options.envName,
    hostPath,
    containerPath: `${options.containerPrefix}${keyFilename}`,
    label: options.label,
  });
}

function resolveServiceKeyHostPath(envName, serviceKey, deploymentDir, backendPath) {
  const candidates = path.isAbsolute(serviceKey)
    ? [serviceKey]
    : [
        path.resolve(deploymentDir, serviceKey),
        path.resolve(backendPath, serviceKey),
        path.resolve(backendPath, "ogrre", serviceKey),
      ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  const label = envName === "STORAGE_SERVICE_KEY" ? "storage" : "Document AI";
  console.error(
    [
      `Unable to find ${envName} file '${serviceKey}'.`,
      `Because OGRRE is configured for Google ${label}, the backend container must be able to mount this service-account key.`,
      `Provide the key file in one of the checked locations, or set ${envName} to an absolute path.`,
      "Checked:",
      ...candidates.map((candidate) => `  - ${candidate}`),
    ].join("\n")
  );
  process.exit(1);
}

function quoteYamlString(value) {
  return JSON.stringify(value);
}

module.exports = {
  createStorageCredentialOverrideFile,
};
