const getAttributeRow = (fieldName) => (
  cy
    .getByCy("attribute-row", { timeout: 30000 })
    .filter(`[data-field-key="${fieldName}"], [data-field-alias="${fieldName}"]`)
    .first()
);

const openAttributeEditor = (fieldName) => {
  getAttributeRow(fieldName).then(($row) => {
    if ($row.find('[data-cy="edit-field-button"]').length) {
      return cy.wrap($row).find('[data-cy="edit-field-button"]').click();
    }

    cy.wrap($row).click();
    return cy.wrap($row).find('[data-cy="edit-field-button"]').click();
  });
};

const waitForRecordFetch = (alias, expectedName) => {
  return cy.wait(alias, { timeout: 30000 }).then(({ response }) => {
    expect(response?.statusCode).to.be.oneOf([200, 303]);
    expect(response?.body.recordData.name).to.eq(expectedName);
    cy.log(`Fetched record ${response?.body.recordData.name}`);
  });
};

describe("record review workflow", () => {
  beforeEach(() => {
    cy.resetSeedData();
    cy.clearLocalStorage();
  });

  it("edits a field, cancels with Escape, toggles raw values, and resets status", () => {
    cy.findSeededEntities().then(({ seed, record }) => {
      cy.intercept("POST", `${Cypress.env("backendURL")}/get_record/${record._id}`).as("getSeedRecord");
      cy.visitApp(`/record/${record._id}`);
      waitForRecordFetch("@getSeedRecord", seed.recordName);
      cy.findByRole("columnheader", { name: /field/i, timeout: 30000 }).should("be.visible");
      cy.getByCy("fullscreen-table-button").click();

      openAttributeEditor(seed.reviewFieldName);

      cy.intercept("POST", `${Cypress.env("backendURL")}/update_record/**`).as("updateRecord");
      cy.getByCy("edit-field-input").find("input").clear().type("edited{enter}");
      cy.wait("@updateRecord").its("response.statusCode").should("eq", 200);
      getAttributeRow(seed.reviewFieldName).should("contain.text", "Edited");
      cy.getByCy("review-status-chip").should("contain.text", "incomplete");

      openAttributeEditor(seed.reviewFieldName);
      cy.getByCy("edit-field-input").find("input").clear().type("cancelled{esc}");
      getAttributeRow(seed.reviewFieldName).should("not.contain.text", "cancelled");

      cy.getByCy("raw-values-toggle").click();
      cy.findByRole("columnheader", { name: /raw value/i }).should("be.visible");

      cy.getByCy("split-button-toggle").click();
      cy.contains('[data-cy="split-button-option"]', "Reset to unreviewed").click();
      cy.getByCy("split-button-primary").click();
      cy.getByCy("popup-primary-button").click();
      cy.wait("@updateRecord").its("response.statusCode").should("eq", 200);
      cy.waitForAppAuth();
      waitForRecordFetch("@getSeedRecord", seed.recordName);
      cy.getByCy("review-status-chip", { timeout: 15000 }).should("contain.text", "unreviewed");
    });
  });

  it("marks records incomplete, defective, and navigates previous/next with buttons and shortcuts", () => {
    cy.findSeededEntities().then(({ seed, recordGroup, record }) => {
      cy.findRecordByName(recordGroup._id, seed.nextRecordName).then((nextRecord) => {
        cy.findRecordByName(recordGroup._id, seed.previousRecordName).then((previousRecord) => {
          cy.intercept("POST", `${Cypress.env("backendURL")}/get_record/${record._id}`).as("getSeedRecord");
          cy.visitApp(`/record/${record._id}`);
          waitForRecordFetch("@getSeedRecord", seed.recordName);
          cy.findByRole("columnheader", { name: /field/i, timeout: 30000 }).should("be.visible");

          cy.intercept("POST", `${Cypress.env("backendURL")}/update_record/${record._id}`).as("updateSeedRecord");
          cy.getByCy("split-button-primary").click();
          cy.wait("@updateSeedRecord").its("response.statusCode").should("eq", 200);
          cy.waitForAppAuth();
          waitForRecordFetch("@getSeedRecord", seed.recordName);
          cy.getByCy("review-status-chip", { timeout: 15000 }).should("contain.text", "incomplete");

          cy.getByCy("split-button-toggle").click();
          cy.contains('[data-cy="split-button-option"]', "Mark as defective").click();
          cy.getByCy("split-button-primary").click();
          cy.getByCy("defective-dialog").should("be.visible");
          cy.contains('[data-cy="defective-category"]', "Other").click();
          cy.getByCy("defective-description-input").find("textarea").first().type("Cypress defect note");
          cy.getByCy("mark-defective-submit").click();
          cy.wait("@updateSeedRecord").its("response.statusCode").should("eq", 200);
          cy.waitForAppAuth();
          waitForRecordFetch("@getSeedRecord", seed.recordName);
          cy.getByCy("review-status-chip", { timeout: 15000 }).should("contain.text", "defective");

          cy.intercept("POST", `${Cypress.env("backendURL")}/get_record/${nextRecord._id}`).as("getNextRecord");
          cy.getByCy("next-record-button").click();
          waitForRecordFetch("@getNextRecord", seed.nextRecordName);
          cy.getByCy("subheader-title", { timeout: 15000 }).should("contain", seed.nextRecordName);

          cy.get("body").type("{ctrl}{leftArrow}");
          waitForRecordFetch("@getSeedRecord", seed.recordName);
          cy.getByCy("subheader-title", { timeout: 15000 }).should("contain", seed.recordName);

          cy.intercept("POST", `${Cypress.env("backendURL")}/get_record/${previousRecord._id}`).as("getPreviousRecord");
          cy.get("body").type("{ctrl}{leftArrow}");
          waitForRecordFetch("@getPreviousRecord", seed.previousRecordName);
          cy.getByCy("subheader-title", { timeout: 15000 }).should("contain", seed.previousRecordName);
        });
      });
    });
  });
});
