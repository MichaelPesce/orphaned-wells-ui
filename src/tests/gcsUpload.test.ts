import { runWithConcurrency, uploadedOffset, uploadFileToGcs } from "../services/gcsUpload.service";

test("bounds concurrent file transfers", async () => {
  let active = 0;
  let peak = 0;
  const completed: number[] = [];
  await runWithConcurrency(Array.from({length: 500}, (_, index) => index), async (index) => {
    active++;
    peak = Math.max(peak, active);
    await Promise.resolve();
    active--;
    completed.push(index);
  });
  expect(peak).toBe(4);
  expect(completed).toHaveLength(500);
});

test("waits for outstanding transfers when one fails", async () => {
  let finish: () => void = () => {};
  let settled = false;
  const operation = runWithConcurrency([0, 1], async (index) => {
    if (index === 0) throw new Error("failed");
    await new Promise<void>((resolve) => { finish = resolve; });
  }).catch(() => { settled = true; });
  await Promise.resolve();
  expect(settled).toBe(false);
  finish();
  await operation;
  expect(settled).toBe(true);
});

test("validates storage offsets", () => {
  expect(uploadedOffset(null, 100)).toBe(0);
  expect(uploadedOffset("bytes=0-49", 100)).toBe(50);
  expect(() => uploadedOffset("bytes=10-20", 100)).toThrow();
  expect(() => uploadedOffset("bytes=0-100", 100)).toThrow();
});

test("uploads chunks directly to GCS without API credentials or CSRF headers", async () => {
  const requests: {range: string; size: number; credentials: boolean}[] = [];
  const original = window.XMLHttpRequest;
  class FakeRequest {
    withCredentials = false;
    timeout = 0;
    status = 308;
    range = "";
    upload = {};
    onload = () => {};
    open = jest.fn();
    abort = jest.fn();
    setRequestHeader(name: string, value: string) {
      expect(name).toBe("Content-Range");
      this.range = value;
    }
    getResponseHeader() { return requests.length === 1 ? "bytes=0-8388607" : null; }
    send(body: Blob) {
      requests.push({range: this.range, size: body.size, credentials: this.withCredentials});
      this.status = requests.length === 2 ? 200 : 308;
      this.onload();
    }
  }
  window.XMLHttpRequest = FakeRequest as unknown as typeof XMLHttpRequest;
  try {
    const file = new File([new Uint8Array(9 * 1024 * 1024)], "well.pdf");
    await uploadFileToGcs("https://storage.googleapis.com/upload/session", file, new AbortController().signal, jest.fn());
    expect(requests).toEqual([
      {range: "bytes 0-8388607/9437184", size: 8388608, credentials: false},
      {range: "bytes 8388608-9437183/9437184", size: 1048576, credentials: false},
    ]);
  } finally { window.XMLHttpRequest = original; }
});

test("rejects an unexpected upload destination before sending bytes", async () => {
  await expect(uploadFileToGcs("https://untrusted.example/upload", new File(["pdf"], "well.pdf"),
    new AbortController().signal, jest.fn())).rejects.toThrow("Invalid storage upload destination");
});

test("queries the committed offset after a network failure before resending", async () => {
  const original = window.XMLHttpRequest;
  const ranges: string[] = [];
  const sizes: number[] = [];
  class FakeRequest {
    upload = {};
    status = 0;
    onload = () => {};
    open = jest.fn();
    abort = jest.fn();
    setRequestHeader(_: string, value: string) { ranges.push(value); }
    getResponseHeader() { return "bytes=0-4"; }
    send(body: Blob) {
      sizes.push(body.size);
      this.status = [0, 308, 200][sizes.length - 1];
      this.onload();
    }
  }
  window.XMLHttpRequest = FakeRequest as unknown as typeof XMLHttpRequest;
  const delay = jest.spyOn(global, "setTimeout").mockImplementation((callback: any) => {
    callback();
    return 0 as any;
  });
  try {
    await uploadFileToGcs("https://storage.googleapis.com/upload/session", new File(["abcdefghijkl"], "well.pdf"),
      new AbortController().signal, jest.fn());
    expect(ranges).toEqual(["bytes 0-11/12", "bytes */12", "bytes 5-11/12"]);
    expect(sizes).toEqual([12, 0, 7]);
  } finally {
    window.XMLHttpRequest = original;
    delay.mockRestore();
  }
});
