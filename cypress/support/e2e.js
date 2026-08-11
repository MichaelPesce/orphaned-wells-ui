import "./commands";

const FETCH_FAILURES_KEY = "__cypressFetchFailures";

const readStoredFetchFailures = (win) => {
  try {
    return JSON.parse(win.sessionStorage.getItem(FETCH_FAILURES_KEY) || "[]");
  } catch {
    return [];
  }
};

const storeFetchFailure = (win, failure) => {
  const failures = readStoredFetchFailures(win);
  failures.push(failure);
  win.sessionStorage.setItem(FETCH_FAILURES_KEY, JSON.stringify(failures));
};

Cypress.on("window:before:load", (win) => {
  if (!win.fetch || win.__cypressFetchInstrumented) return;

  const originalFetch = win.fetch.bind(win);
  win.__cypressFetchInstrumented = true;

  win.fetch = (...args) => {
    const startedAt = Date.now();
    const [input, init] = args;
    const initOptions = init || {};
    const isRequest = typeof win.Request !== "undefined" && input instanceof win.Request;
    const url = typeof input === "string" ? input : input?.url || String(input);
    const method = initOptions.method || (isRequest ? input.method : "GET");

    return originalFetch(...args).catch((error) => {
      const failure = {
        method,
        url,
        pageUrl: win.location.href,
        online: win.navigator.onLine,
        elapsedMs: Date.now() - startedAt,
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        timestamp: new Date().toISOString(),
      };

      storeFetchFailure(win, failure);
      win.console.error("[cypress fetch rejection]", failure);
      throw error;
    });
  };
});

afterEach(() => {
  cy.window({ log: false }).then((win) => {
    const failures = readStoredFetchFailures(win);
    if (!failures.length) return;

    win.sessionStorage.removeItem(FETCH_FAILURES_KEY);
    cy.task("log", `Browser fetch rejections:\n${JSON.stringify(failures, null, 2)}`);
  });
});
