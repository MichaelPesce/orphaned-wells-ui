// GCS session URLs carry their own authorization. XMLHttpRequest deliberately
// avoids the app's fetch wrapper, which adds API cookies and CSRF headers.
const CHUNK_BYTES = 8 * 1024 * 1024;

interface UploadResponse { status: number; range: string | null; }

const sendChunk = (
  url: string, body: Blob, range: string, signal: AbortSignal,
  onProgress?: (bytes: number) => void
): Promise<UploadResponse> => new Promise((resolve, reject) => {
  const xhr = new XMLHttpRequest();
  const abort = () => xhr.abort();
  if (signal.aborted) return reject(new Error("Upload paused"));
  xhr.open("PUT", url);
  xhr.withCredentials = false;
  xhr.timeout = 120000;
  xhr.setRequestHeader("Content-Range", range);
  xhr.upload.onprogress = (event) => onProgress?.(event.loaded);
  const cleanup = () => signal.removeEventListener("abort", abort);
  xhr.onload = () => {
    cleanup();
    resolve({status: xhr.status, range: xhr.getResponseHeader("Range")});
  };
  xhr.onerror = xhr.ontimeout = () => { cleanup(); resolve({status: 0, range: null}); };
  xhr.onabort = () => { cleanup(); reject(new Error("Upload paused")); };
  signal.addEventListener("abort", abort, {once: true});
  xhr.send(body);
});

const transient = (status: number) => status === 0 || status === 408 || status === 429 || status >= 500;

export const uploadedOffset = (range: string | null, size: number): number => {
  if (!range) return 0;
  const match = /^bytes=0-(\d+)$/.exec(range);
  const offset = match ? Number(match[1]) + 1 : NaN;
  if (!Number.isSafeInteger(offset) || offset < 0 || offset > size) {
    throw new Error("Storage returned an invalid upload offset");
  }
  return offset;
};

export const uploadFileToGcs = async (
  url: string, file: File, signal: AbortSignal, onProgress: (bytes: number) => void
): Promise<void> => {
  const target = new URL(url);
  if (target.protocol !== "https:" || target.hostname !== "storage.googleapis.com") {
    throw new Error("Invalid storage upload destination");
  }
  let offset = 0;
  let failures = 0;
  let probe = false;
  while (offset < file.size) {
    const start = offset;
    const end = Math.min(offset + CHUNK_BYTES, file.size);
    const response = await sendChunk(
      url, probe ? new Blob() : file.slice(offset, end),
      probe ? `bytes */${file.size}` : `bytes ${offset}-${end - 1}/${file.size}`,
      signal, probe ? undefined : (bytes) => onProgress(start + bytes)
    );
    if (response.status === 200 || response.status === 201) {
      onProgress(file.size);
      return;
    }
    if (response.status === 308) {
      const nextOffset = uploadedOffset(response.range, file.size);
      if (!probe && nextOffset <= offset) {
        throw new Error("Upload made no progress. Check storage CORS configuration and retry.");
      }
      offset = nextOffset;
      onProgress(offset);
      probe = false;
      continue;
    }
    if (!transient(response.status) || ++failures > 3) {
      throw new Error("File transfer failed. Retry the upload to continue.");
    }
    // Query the committed offset before resending bytes after an uncertain PUT.
    const retryDelay = 500 * 2 ** failures;
    await new Promise((resolve) => setTimeout(resolve, retryDelay));
    probe = true;
  }
  throw new Error("Storage did not confirm the completed upload. Retry to verify the file.");
};

export const runWithConcurrency = async <T,>(items: T[], action: (item: T, index: number) => Promise<void>, concurrency = 4) => {
  let next = 0;
  const workers = Array.from({length: Math.min(concurrency, items.length)}, async () => {
    while (next < items.length) {
      const index = next++;
      await action(items[index], index);
    }
  });
  const results = await Promise.allSettled(workers);
  for (const result of results) {
    if (result.status === "rejected") throw result.reason;
  }
};
