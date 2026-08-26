const fs = require("fs");
const os = require("os");
const path = require("path");

function createStorageCredentialOverrideFile(env, deploymentDir, backendPath) {
  if ((env.STORAGE_BACKEND || "local").toLowerCase() !== "google") {
    return null;
  }

  const storageServiceKey = env.STORAGE_SERVICE_KEY;
  if (!storageServiceKey) {
    console.error("STORAGE_BACKEND=google requires STORAGE_SERVICE_KEY to be set.");
    process.exit(1);
  }

  const hostPath = resolveStorageServiceKeyHostPath(
    storageServiceKey,
    deploymentDir,
    backendPath
  );
  const keyFilename = path.basename(storageServiceKey);
  if (!keyFilename || keyFilename === "." || keyFilename === "..") {
    console.error(`Invalid STORAGE_SERVICE_KEY path: ${storageServiceKey}`);
    process.exit(1);
  }

  const containerPath = `/code/ogrre/${keyFilename}`;
  const overrideDir = fs.mkdtempSync(path.join(os.tmpdir(), "ogrre-compose-"));
  const overrideFile = path.join(overrideDir, "storage-credentials.yml");
  fs.writeFileSync(
    overrideFile,
    [
      "services:",
      "  backend:",
      "    environment:",
      `      STORAGE_SERVICE_KEY: ${quoteYamlString(containerPath)}`,
      `      GOOGLE_APPLICATION_CREDENTIALS: ${quoteYamlString(containerPath)}`,
      "    volumes:",
      "      - type: bind",
      `        source: ${quoteYamlString(hostPath)}`,
      `        target: ${quoteYamlString(containerPath)}`,
      "        read_only: true",
      "",
    ].join("\n")
  );
  console.log(`Mounting Google storage service key into ${containerPath}`);
  return overrideFile;
}

function resolveStorageServiceKeyHostPath(storageServiceKey, deploymentDir, backendPath) {
  const candidates = path.isAbsolute(storageServiceKey)
    ? [storageServiceKey]
    : [
        path.resolve(deploymentDir, storageServiceKey),
        path.resolve(backendPath, storageServiceKey),
        path.resolve(backendPath, "ogrre", storageServiceKey),
      ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }

  console.error(
    [
      `Unable to find STORAGE_SERVICE_KEY file '${storageServiceKey}'.`,
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
