const openRecordGroupTable = () => {
  return cy.findSeededEntities().then(({ seed, recordGroup }) => {
    cy.visitApp(`/record_group/${recordGroup._id}`);
    cy.getByCy("subheader-title", { timeout: 10000 }).should("contain", seed.recordGroupName);
    return cy.getByCy("record-row", { timeout: 30000 }).should("exist").then(() => ({
      seed,
      recordGroup,
    }));
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
      cy.getByDataValue(name).click();
    });
  cy.get("body").type("{esc}");
};

const applyFilters = () => {
  cy.getByCy("apply-filters-button").click({ force: true });
};

const waitForRecordsPage = (alias, page, pageSize) => {
  return cy.wait(alias, { timeout: 30000 }).then(({ request, response }) => {
    const requestUrl = new URL(request.url);
    expect(requestUrl.searchParams.get("page")).to.eq(`${page}`);
    expect(requestUrl.searchParams.get("records_per_page")).to.eq(`${pageSize}`);
    expect(response?.statusCode).to.eq(200);
    expect(response?.body.records, `records on page ${page + 1}`).to.have.length.greaterThan(0);
    return response.body.records;
  });
};

const findRecordWithAttributes = (records) => {
  const record = records.find((candidate) => (
    candidate.status !== "error" &&
    Array.isArray(candidate.attributesList) &&
    candidate.attributesList.length > 0
  ));

  expect(record, "page record with attributes").to.exist;
  return record;
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
      applyFilters();
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
    applyFilters();
    cy.wait("@getRecords").its("request.body.filter.review_status.$in").should("deep.eq", ["unreviewed"]);

    cy.getByCy("filters-button").click();
    cy.getByCy("reset-filters-button").click();
    cy.getByCy("close-filters-button").click();

    cy.intercept("POST", `${Cypress.env("backendURL")}/get_records/**`).as("getVerificationRecords");
    setCheckboxFilterToOnly("Verification Status", "unverified", ["unverified", "awaiting verification", "verified"]);
    applyFilters();
    cy.wait("@getVerificationRecords").its("request.body.filter.verification_status.$in").should("deep.eq", [null]);

    cy.getByCy("filters-button").click();
    cy.getByCy("reset-filters-button").click();
    cy.getByCy("close-filters-button").click();

    cy.intercept("POST", `${Cypress.env("backendURL")}/get_records/**`).as("getErrorRecords");
    setCheckboxFilterToOnly("Error Status", "no cleaning errors", ["has cleaning errors", "no cleaning errors"]);
    applyFilters();
    cy.wait("@getErrorRecords").its("request.body.filter").should("have.property", "$nor");

    cy.getByCy("filters-button").click();
    cy.getByCy("reset-filters-button").click();
    cy.getByCy("close-filters-button").click();

    cy.intercept("POST", `${Cypress.env("backendURL")}/get_records/**`).as("getDateRecords");
    addFilter("Date Uploaded", "Is Before", "2026-01-01");
    applyFilters();
    cy.wait("@getDateRecords").its("request.body.filter.dateCreated.$lt").should("be.a", "number");
  });

  it("sorts, paginates, persists query params, and returns via breadcrumb with table context", () => {
    openRecordGroupTable().then(({ recordGroup }) => {
      cy.intercept("POST", `${Cypress.env("backendURL")}/get_records/**`).as("getRecords");
      cy.getByCy("records-sort-dateCreated").click();
      cy.wait("@getRecords").its("request.body.sort").should("deep.eq", ["dateCreated", -1]);

      cy.findByLabelText(/rows per page/i).select("10");
      waitForRecordsPage("@getRecords", 0, 10);
      cy.location("search").should("include", "pageSize=10");
      cy.findByLabelText(/next page/i).click();
      cy.location("search").should("include", "page=2");
      waitForRecordsPage("@getRecords", 1, 10).then((records) => {
        const record = findRecordWithAttributes(records);
        cy.intercept("POST", `${Cypress.env("backendURL")}/get_record/${record._id}`).as("getRecord");

        cy.getByCy("record-row")
          .filter(`[data-record-id="${record._id}"]`)
          .should("contain.text", record.name)
          .click();

        cy.wait("@getRecord", { timeout: 30000 }).then(({ response }) => {
          expect(response?.statusCode).to.be.oneOf([200, 303]);
          expect(response?.body.recordData.name).to.eq(record.name);
          expect(response?.body.recordData.attributesList).to.have.length.greaterThan(0);
        });
      });
      cy.findByRole("columnheader", { name: /field/i, timeout: 30000 }).should("be.visible");
      cy.contains('[data-cy="breadcrumb-link"]', recordGroup.name).click();

      cy.location("pathname").should("eq", `/record_group/${recordGroup._id}`);
      cy.location("search").should("include", "page=2");
      cy.location("search").should("include", "pageSize=10");
    });
  });
});
