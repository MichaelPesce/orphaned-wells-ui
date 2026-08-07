const openRecordGroupTable = () => {
  return cy.findSeededEntities().then(({ seed, recordGroup }) => {
    cy.visitApp(`/record_group/${recordGroup._id}`);
    cy.getByCy("subheader-title", { timeout: 10000 }).should("contain", seed.recordGroupName);
    cy.getByCy("record-row", { timeout: 30000 }).should("exist");
    return { seed, recordGroup };
  });
};

const addFilter = (columnName, operatorName, value) => {
  cy.getByCy("filters-button").click();
  cy.getByCy("add-filter-button").click();
  cy.getByCy("filter-column-select").last().click();
  cy.contains("li", columnName).click();

  if (operatorName) {
    cy.getByCy("filter-operator-select").last().click();
    cy.contains("li", operatorName).click();
  }

  if (typeof value === "string") {
    cy.getByCy("table-filter").last().find('[data-cy="string-filter-input"], [data-cy="date-filter-input"]').type(value, { force: true });
  }
};

const setCheckboxFilterToOnly = (columnName, selectedName, allNames) => {
  cy.getByCy("filters-button").click();
  cy.getByCy("add-filter-button").click();
  cy.getByCy("filter-column-select").last().click();
  cy.contains("li", columnName).click();
  cy.getByCy("filter-values-select").last().click();

  allNames
    .filter((name) => name !== selectedName)
    .forEach((name) => {
      cy.contains("li", name).click();
    });

  cy.get("body").type("{esc}");
};

describe("record tables", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("loads seeded records and applies a string filter", () => {
    openRecordGroupTable().then(({ seed }) => {
      cy.getByCy("record-row").should("have.length", seed.recordGroupRecordCount);

      cy.intercept("POST", `${Cypress.env("backendURL")}/get_records/**`).as("getRecords");
      addFilter("Record Name", "Contains", "_2");
      cy.getByCy("apply-filters-button").click();
      cy.wait("@getRecords").its("request.body.filter.name.$regex").should("eq", "_2");
      cy.getByCy("record-row").should("have.length", 1);

      cy.getByCy("filters-button").click();
      cy.getByCy("reset-filters-button").click();
      cy.getByCy("record-row", { timeout: 10000 }).should("have.length", seed.recordGroupRecordCount);
    });
  });

  it("sends checkbox, date, error, review, and verification filters", () => {
    openRecordGroupTable();

    cy.intercept("POST", `${Cypress.env("backendURL")}/get_records/**`).as("getRecords");
    setCheckboxFilterToOnly("Review Status", "unreviewed", ["reviewed", "unreviewed", "incomplete", "defective"]);
    cy.getByCy("apply-filters-button").click();
    cy.wait("@getRecords").its("request.body.filter.review_status.$in").should("deep.eq", ["unreviewed"]);

    cy.getByCy("filters-button").click();
    cy.getByCy("reset-filters-button").click();

    cy.intercept("POST", `${Cypress.env("backendURL")}/get_records/**`).as("getVerificationRecords");
    setCheckboxFilterToOnly("Verification Status", "unverified", ["unverified", "awaiting verification", "verified"]);
    cy.getByCy("apply-filters-button").click();
    cy.wait("@getVerificationRecords").its("request.body.filter.verification_status.$in").should("deep.eq", [null]);

    cy.getByCy("filters-button").click();
    cy.getByCy("reset-filters-button").click();

    cy.intercept("POST", `${Cypress.env("backendURL")}/get_records/**`).as("getErrorRecords");
    setCheckboxFilterToOnly("Error Status", "no cleaning errors", ["has cleaning errors", "no cleaning errors"]);
    cy.getByCy("apply-filters-button").click();
    cy.wait("@getErrorRecords").its("request.body.filter").should("have.property", "$nor");

    cy.getByCy("filters-button").click();
    cy.getByCy("reset-filters-button").click();

    cy.intercept("POST", `${Cypress.env("backendURL")}/get_records/**`).as("getDateRecords");
    addFilter("Date Uploaded", "Is Before", "2026-01-01");
    cy.getByCy("apply-filters-button").click();
    cy.wait("@getDateRecords").its("request.body.filter.dateCreated.$lt").should("be.a", "number");
  });

  it("sorts, paginates, persists query params, and returns via breadcrumb with table context", () => {
    openRecordGroupTable().then(({ recordGroup }) => {
      cy.intercept("POST", `${Cypress.env("backendURL")}/get_records/**`).as("getRecords");
      cy.getByCy("records-sort-dateCreated").click();
      cy.wait("@getRecords").its("request.body.sort.0").should("eq", "dateCreated");

      cy.findByLabelText(/rows per page/i).select("10");
      cy.location("search").should("include", "pageSize=10");
      cy.findByLabelText(/next page/i).click();
      cy.location("search").should("include", "page=2");

      cy.getByCy("record-row").first().click();
      cy.findByRole("columnheader", { name: /field/i, timeout: 30000 }).should("be.visible");
      cy.contains('[data-cy="breadcrumb-link"]', recordGroup.name).click();

      cy.location("pathname").should("eq", `/record_group/${recordGroup._id}`);
      cy.location("search").should("include", "page=2");
      cy.location("search").should("include", "pageSize=10");
    });
  });
});
