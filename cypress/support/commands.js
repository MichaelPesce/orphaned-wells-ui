/// <reference types="cypress" />

import "@testing-library/cypress/add-commands";

const ALL_PERMISSIONS = [
  "add_user",
  "clean_record",
  "create_project",
  "create_record_group",
  "delete",
  "manage_project",
  "manage_schema",
  "manage_system",
  "manage_team",
  "review_record",
  "system_administration",
  "update_coordinates",
  "upload_document",
  "verify_record",
  "update_coordinates",
];

const backendUrl = () => Cypress.env("backendURL") || "http://localhost:8001";

const normalizeAuthMode = () => String(Cypress.env("authMode") || "mock").toLowerCase();
const isMockAuthMode = () => ["mock", "stubbed", "stub"].includes(normalizeAuthMode());

const buildMockUser = (overrides = {}) => ({
  email: "anonymous",
  name: "Cypress Anonymous User",
  picture: "",
  roles: {},
  permissions: ALL_PERMISSIONS,
  anonymous: false,
  default_team: Cypress.env("team") || "default",
  collaborator: Cypress.env("collaborator") || "isgs",
  ...overrides,
});

Cypress.Commands.add("getByCy", (selector, ...args) => {
  return cy.get(`[data-cy="${selector}"]`, ...args);
});

Cypress.Commands.add("getByDataValue", (selector, ...args) => {
  return cy.get(`[data-value="${selector}"]`, ...args);
});

Cypress.Commands.add("resetSeedData", () => {
  if (!Cypress.env("resetDb")) return;
  cy.task("seedDatabase", null, { timeout: 120000 });
});

Cypress.Commands.add("api", (method, route, body, options = {}) => {
  const normalizedRoute = route.startsWith("/") ? route : `/${route}`;
  const requestOptions = {
    method,
    url: `${backendUrl()}${normalizedRoute}`,
    failOnStatusCode: options.failOnStatusCode ?? true,
    ...options,
  };

  if (body !== undefined) requestOptions.body = body;

  return cy.request(requestOptions);
});

Cypress.Commands.add("waitForBackend", () => {
  cy.request({
    url: `${backendUrl()}/docs`,
    failOnStatusCode: false,
    timeout: 30000,
  }).its("status").should("be.oneOf", [200, 401, 403]);
});

Cypress.Commands.add("mockCheckAuth", (userOverrides = {}) => {
  const user = buildMockUser(userOverrides);
  cy.intercept("POST", `${backendUrl()}/check_auth`, {
    statusCode: 200,
    body: {
      user_data: user,
      environment: "test",
    },
  }).as("checkAuth");
});

Cypress.Commands.add("waitForAppAuth", () => {
  if (!isMockAuthMode()) return cy.wrap(null, { log: false });

  return cy.wait("@checkAuth", { timeout: 30000 })
    .its("response.statusCode")
    .should("eq", 200);
});

Cypress.Commands.add("loginByGoogleApi", () => {
  const bypassAuth = String(Cypress.env("BYPASS_AUTH")).toLowerCase() === "true";
  if (bypassAuth) {
    cy.log("Bypassing authentication");
    return;
  }

  cy.log("Logging in to Google");
  const requestBody = {
    grant_type: "refresh_token",
    client_id: Cypress.env("googleClientId"),
    client_secret: Cypress.env("googleClientSecret"),
    refresh_token: Cypress.env("googleRefreshToken"),
  };

  cy.request({
    method: "POST",
    url: "https://www.googleapis.com/oauth2/v4/token",
    body: requestBody,
  }).then(({ body }) => {
    const { access_token, id_token } = body;
    window.localStorage.setItem("access_token", access_token);
    window.localStorage.setItem("id_token", id_token);
    cy.request({
      method: "POST",
      url: `${backendUrl()}/check_auth`,
      body: JSON.stringify(id_token),
      headers: { Authorization: `Bearer ${id_token}` },
    }).then(({ body: authBody }) => {
      window.localStorage.setItem("user_email", authBody.email);
      window.localStorage.setItem("user_hd", authBody.hd);
      window.localStorage.setItem("role", `${authBody.role}`);
      window.localStorage.setItem("permissions", JSON.stringify(authBody.permissions));
      window.localStorage.setItem("user_name", authBody.name);
      window.localStorage.setItem("user_picture", authBody.picture);
      window.localStorage.setItem("user_info", JSON.stringify(authBody));
      cy.visit("/");
    });
  });
});

Cypress.Commands.add("loginForE2E", (userOverrides = {}) => {
  const authMode = normalizeAuthMode();

  if (authMode === "google") {
    cy.loginByGoogleApi();
    return;
  }

  if (isMockAuthMode()) {
    return cy.mockCheckAuth(userOverrides);
  }

  return cy.wrap(null, { log: false });
});

Cypress.Commands.add("visitApp", (path = "/projects", userOverrides = {}) => {
  cy.loginForE2E(userOverrides);
  cy.visit(path);
  cy.waitForAppAuth();
});

Cypress.Commands.add("findProjectByName", (projectName) => {
  return cy.api("GET", "/get_projects").then(({ body }) => {
    const project = body.find((candidate) => candidate.name === projectName);
    expect(project, `project '${projectName}'`).to.exist;
    return project;
  });
});

Cypress.Commands.add("findRecordGroupByName", (projectId, recordGroupName) => {
  return cy.api("GET", `/get_record_groups/${projectId}`).then(({ body }) => {
    const recordGroup = body.record_groups.find((candidate) => candidate.name === recordGroupName);
    expect(recordGroup, `record group '${recordGroupName}'`).to.exist;
    return recordGroup;
  });
});

Cypress.Commands.add("getRecordsFor", (location, id, options = {}) => {
  const page = options.page ?? 0;
  const pageSize = options.pageSize ?? 250;
  const requestBody = {
    sort: options.sort || ["dateCreated", 1],
    filter: options.filter || {},
    id,
  };

  return cy
    .api("POST", `/get_records/${location}?page=${page}&records_per_page=${pageSize}`, requestBody)
    .its("body");
});

Cypress.Commands.add("findRecordByName", (recordGroupId, recordName) => {
  return cy.getRecordsFor("record_group", recordGroupId).then((body) => {
    const record = body.records.find((candidate) => candidate.name === recordName);
    expect(record, `record '${recordName}'`).to.exist;
    return record;
  });
});

Cypress.Commands.add("findSeededEntities", () => {
  return cy.fixture("seeded-data").then((seed) => {
    return cy.findProjectByName(seed.projectName).then((project) => {
      return cy.findRecordGroupByName(project._id, seed.recordGroupName).then((recordGroup) => {
        return cy.findRecordByName(recordGroup._id, seed.recordName).then((record) => ({
          seed,
          project,
          recordGroup,
          record,
        }));
      });
    });
  });
});

Cypress.Commands.add("cleanupProjectByName", (projectName) => {
  cy.api("GET", "/get_projects", undefined, { failOnStatusCode: false }).then(({ body, status }) => {
    if (status >= 400 || !Array.isArray(body)) return;

    body
      .filter((project) => project.name === projectName)
      .forEach((project) => {
        cy.api("POST", `/delete_project/${project._id}`, undefined, { failOnStatusCode: false });
      });
  });
});

Cypress.Commands.add("cleanupRecordGroupByName", (projectId, recordGroupName) => {
  cy.api("GET", `/get_record_groups/${projectId}`, undefined, { failOnStatusCode: false }).then(({ body, status }) => {
    if (status >= 400 || !body?.record_groups) return;

    body.record_groups
      .filter((recordGroup) => recordGroup.name === recordGroupName)
      .forEach((recordGroup) => {
        cy.api("POST", `/delete_record_group/${recordGroup._id}`, undefined, { failOnStatusCode: false });
      });
  });
});

Cypress.Commands.add("deleteSchemaField", (processorName, fieldName) => {
  cy.api(
    "POST",
    "/update_processor_attribute",
    {
      processor_name: processorName,
      field_name: fieldName,
      updates: {},
      operation: "delete",
    },
    { failOnStatusCode: false }
  );
});

Cypress.Commands.add("enter_text", (identifier, roleOrClass, value, name) => {
  let inputTextbox;
  if (identifier === "role") {
    inputTextbox = cy.findByRole(roleOrClass, { name });
  } else if (identifier === "class") {
    inputTextbox = cy.get(`.${roleOrClass}`);
  } else if (identifier === "id") {
    inputTextbox = cy.get(`#${roleOrClass}`);
  }

  inputTextbox.click({ force: true });

  if (identifier === "role") {
    cy.findByRole(roleOrClass, { name }).clear().type(value);
  } else if (identifier === "class") {
    cy.get(`.${roleOrClass}`).type(`{backspace}{backspace}{backspace}{backspace}${value}`);
  } else if (identifier === "id") {
    cy.get(`#${roleOrClass}`).type(`{backspace}{backspace}{backspace}{backspace}${value}`);
  }
});
