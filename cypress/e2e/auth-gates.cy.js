const authRequired = () => String(Cypress.env("authMode") || "").toLowerCase() === "required";

describe("limited auth gates", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("redirects protected pages to login when check_auth is unauthorized", () => {
    cy.intercept("POST", `${Cypress.env("backendURL")}/check_auth`, {
      statusCode: 401,
      body: { detail: "missing authentication token" },
    }).as("checkAuth");

    cy.visit("/projects");
    cy.wait("@checkAuth");
    cy.location("pathname").should("eq", "/login");
    cy.findByRole("button", { name: /login with google/i }).should("be.visible");
  });

  it("renders the login page", () => {
    cy.intercept("POST", `${Cypress.env("backendURL")}/check_auth`, {
      statusCode: 401,
      body: { detail: "missing authentication token" },
    });

    cy.visit("/login");
    cy.findByRole("button", { name: /login with google/i }).should("be.visible");
  });

  it("returns 401 for protected API calls without a session when auth is required", function () {
    if (!authRequired()) this.skip();

    cy.api("GET", "/get_projects", undefined, { failOnStatusCode: false })
      .its("status")
      .should("eq", 401);
  });

  it("hides admin navigation and create/upload/delete actions for a limited mocked user", () => {
    cy.mockCheckAuth({
      permissions: [],
      default_team: "default",
      collaborator: "isgs",
    });

    cy.visit("/projects");
    cy.wait("@checkAuth");
    cy.getByCy("header-tab-users").should("not.exist");
    cy.getByCy("header-tab-schema").should("not.exist");
    cy.getByCy("subheader-primary-action").should("not.exist");
  });

  it("shows admin navigation and page actions for an admin-like mocked user", () => {
    cy.mockCheckAuth({
      permissions: [
        "create_project",
        "create_record_group",
        "delete",
        "manage_project",
        "manage_schema",
        "manage_team",
        "upload_document",
      ],
      default_team: "default",
      collaborator: "isgs",
    });

    cy.visit("/projects");
    cy.wait("@checkAuth");
    cy.getByCy("header-tab-users").should("be.visible");
    cy.getByCy("header-tab-schema").should("be.visible");
    cy.getByCy("subheader-primary-action").should("contain.text", "New Project");
  });
});
