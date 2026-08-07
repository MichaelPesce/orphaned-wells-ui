const getAttributeRow = (fieldName) => (
  cy
    .getByCy("attribute-row", { timeout: 30000 })
    .filter(`[data-field-key="${fieldName}"], [data-field-alias="${fieldName}"]`)
    .first()
);

describe("record review workflow", () => {
  beforeEach(() => {
    cy.resetSeedData();
    cy.clearLocalStorage();
  });

  it("edits a field, cancels with Escape, toggles raw values, and resets status", () => {
    cy.findSeededEntities().then(({ seed, record }) => {
      cy.visitApp(`/record/${record._id}`);
      cy.findByRole("columnheader", { name: /field/i, timeout: 30000 }).should("be.visible");
      cy.getByCy("fullscreen-table-button").click();

      getAttributeRow(seed.reviewFieldName).as("fieldRow");
      cy.get("@fieldRow").click();
      cy.getByCy("edit-field-button").click();

      cy.intercept("POST", `${Cypress.env("backendURL")}/update_record/**`).as("updateRecord");
      cy.getByCy("edit-field-input").find("input").clear().type("edited{enter}");
      cy.wait("@updateRecord").its("response.statusCode").should("eq", 200);
      getAttributeRow(seed.reviewFieldName).should("contain.text", "Edited");
      cy.getByCy("review-status-chip").should("contain.text", "incomplete");

      getAttributeRow(seed.reviewFieldName).click();
      cy.getByCy("edit-field-button").click();
      cy.getByCy("edit-field-input").find("input").clear().type("cancelled{esc}");
      getAttributeRow(seed.reviewFieldName).should("not.contain.text", "cancelled");

      cy.getByCy("raw-values-toggle").click();
      cy.findByRole("columnheader", { name: /raw value/i }).should("be.visible");

      cy.getByCy("split-button-toggle").click();
      cy.contains('[data-cy="split-button-option"]', "Reset to unreviewed").click();
      cy.getByCy("split-button-primary").click();
      cy.getByCy("popup-primary-button").click();
      cy.getByCy("review-status-chip", { timeout: 15000 }).should("contain.text", "unreviewed");
    });
  });

  it("marks records incomplete, defective, and navigates previous/next with buttons and shortcuts", () => {
    cy.findSeededEntities().then(({ seed, record }) => {
      cy.visitApp(`/record/${record._id}`);
      cy.findByRole("columnheader", { name: /field/i, timeout: 30000 }).should("be.visible");

      cy.getByCy("split-button-primary").click();
      cy.getByCy("review-status-chip", { timeout: 15000 }).should("contain.text", "incomplete");

      cy.getByCy("split-button-toggle").click();
      cy.contains('[data-cy="split-button-option"]', "Mark as defective").click();
      cy.getByCy("split-button-primary").click();
      cy.getByCy("defective-dialog").should("be.visible");
      cy.contains('[data-cy="defective-category"]', "Other").click();
      cy.getByCy("defective-description-input").find("textarea").first().type("Cypress defect note");
      cy.getByCy("mark-defective-submit").click();
      cy.getByCy("review-status-chip", { timeout: 15000 }).should("contain.text", "defective");

      cy.getByCy("next-record-button").click();
      cy.getByCy("subheader-title", { timeout: 15000 }).should("contain", seed.nextRecordName);

      cy.get("body").type("{ctrl}{leftArrow}");
      cy.getByCy("subheader-title", { timeout: 15000 }).should("contain", seed.recordName);

      cy.get("body").type("{ctrl}{leftArrow}");
      cy.getByCy("subheader-title", { timeout: 15000 }).should("contain", seed.previousRecordName);
    });
  });
});
