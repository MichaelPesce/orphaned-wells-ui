describe("schema UI", () => {
  beforeEach(() => {
    cy.resetSeedData();
    cy.clearLocalStorage();
  });

  it("navigates schema, edits a test-created field, validates page order, and removes it", () => {
    const fieldName = `cypress_field_${Date.now()}`;
    const fieldAlias = "Cypress Field";
    const editedAlias = "Cypress Field Edited";

    cy.api("GET", "/get_schema").then(({ body }) => {
      const processor = body[0];
      expect(processor, "seeded processor").to.exist;
      cy.deleteSchemaField(processor.name, fieldName);

      cy.visitApp("/schema");
      cy.getByCy("schema-table", { timeout: 30000 }).should("be.visible");
      cy.contains('[data-cy="schema-processor-row"]', processor.name).click();

      cy.getByCy("schema-add-field-button").click();
      cy.getByCy("add-schema-field-dialog").should("be.visible");
      cy.getByCy("add-schema-field-name").find("input").type(fieldName);
      cy.getByCy("add-schema-field-display-name").find("input").type(fieldAlias);
      cy.getByCy("add-schema-data-type").click();
      cy.contains("li", "Plain text").click();

      cy.getByCy("add-schema-page-order").find("input").clear().type("0");
      cy.contains("Must be an integer greater than 0").should("be.visible");
      cy.getByCy("add-schema-submit").should("be.disabled");

      cy.getByCy("add-schema-page-order").find("input").clear().type("999");
      cy.intercept("POST", `${Cypress.env("backendURL")}/update_processor_attribute`).as("updateSchema");
      cy.getByCy("add-schema-submit").click();
      cy.wait("@updateSchema").its("response.statusCode").should("eq", 200);
      cy.contains('[data-cy="schema-field-row"]', fieldName, { timeout: 10000 })
        .scrollIntoView()
        .should("be.visible");

      cy.contains('[data-cy="schema-field-row"]', fieldName).scrollIntoView().within(() => {
        cy.getByCy("schema-edit-field-button").click();
        cy.getByCy("schema-edit-alias").find("input").clear().type(editedAlias);
        cy.getByCy("schema-save-field-button").click();
      });
      cy.wait("@updateSchema").its("response.statusCode").should("eq", 200);
      cy.contains('[data-cy="schema-field-row"]', editedAlias).scrollIntoView().should("be.visible");

      cy.contains('[data-cy="schema-field-row"]', fieldName).scrollIntoView().within(() => {
        cy.getByCy("schema-remove-field-button").click();
      });
      cy.getByCy("popup-primary-button").click();
      cy.wait("@updateSchema").its("response.statusCode").should("eq", 200);
      cy.contains('[data-cy="schema-field-row"]', fieldName).should("not.exist");
    });
  });

  it("opens OGRRE version dialog with a mocked backend response", () => {
    cy.intercept("GET", `${Cypress.env("backendURL")}/get_ogrre_version`, {
      statusCode: 200,
      body: {
        deployment: {
          image: "ogrre/backend:cypress",
          deploy_run_id: "12345",
          deployed_at: "2026-08-07T00:00:00Z",
        },
        packages: [
          {
            name: "orphaned-wells-ui-server",
            version: "cypress",
            commit: "abc123",
          },
        ],
      },
    }).as("getVersion");

    cy.visitApp("/schema");
    cy.getByCy("profile-menu-button").click();
    cy.getByCy("ogrre-version-menu-item").click();
    cy.wait("@getVersion").its("response.statusCode").should("eq", 200);
    cy.findByRole("dialog").should("contain.text", "OGRRE Version");
    cy.findByRole("dialog").should("contain.text", "ogrre/backend:cypress");
  });

  it("validates upload processor required fields and file type", () => {
    cy.visitApp("/schema");
    cy.getByCy("subheader-primary-action").click();
    cy.getByCy("upload-processor-dialog").should("exist");
    cy.getByCy("processor-upload-submit").should("be.disabled");

    cy.getByCy("processor-upload-dropzone").selectFile("cypress/fixtures/files/unsupported.txt", {
      action: "drag-drop",
    });
    cy.contains("Unsupported file type").should("be.visible");

    cy.getByCy("processor-upload-dropzone").selectFile("cypress/fixtures/files/processor.json", {
      action: "drag-drop",
    });
    cy.getByCy("processor-name-input").find("input").type("cypress_processor");
    cy.getByCy("processor-display-name-input").find("input").type("Cypress Processor");
    cy.getByCy("processor-id-input").find("input").type("processor-id");
    cy.getByCy("processor-model-id-input").find("input").type("model-id");
    cy.getByCy("processor-document-type-input").find("input").type("Cypress Document");
    cy.getByCy("processor-upload-submit").should("be.enabled");
  });
});
