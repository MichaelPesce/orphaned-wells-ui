const waitForRecordGroupRecords = (alias, recordGroupId, expectedRecordName) => {
  return cy.wait(alias, { timeout: 30000 }).then(({ request, response }) => {
    expect(request.body.id).to.eq(recordGroupId);
    expect(response?.statusCode).to.eq(200);
    expect(response?.body.record_count, "record count").to.be.greaterThan(0);
    expect(response?.body.records.map((record) => record.name)).to.include(expectedRecordName);
  });
};

const waitForRecordFetch = (alias, expectedRecordName) => {
  return cy.wait(alias, { timeout: 30000 }).then(({ response }) => {
    expect(response?.statusCode).to.be.oneOf([200, 303]);
    expect(response?.body.recordData.name).to.eq(expectedRecordName);
  });
};

const expectRecordsTableShell = () => {
  cy.findByRole("columnheader", { name: /record name/i }).should("be.visible");
  cy.findByRole("columnheader", { name: /record group/i }).should("be.visible");
  cy.getByCy("filters-button").should("be.visible");
  cy.getByCy("records-export-button").should("be.visible");
};

describe("core navigation smoke", () => {
  before(() => {
    cy.resetSeedData();
  });

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("loads seeded data and navigates projects to project to record group to record", () => {
    cy.findSeededEntities().then(({ seed, recordGroup, record }) => {
      cy.visitApp("/projects");

      cy.getByCy("project-row").contains(seed.projectName).click();
      cy.getByCy("subheader-title").should("contain", seed.projectName);
      cy.findByRole("columnheader", { name: /record group name/i }).should("be.visible");

      cy.intercept("POST", `${Cypress.env("backendURL")}/get_records/record_group*`).as("loadRecordGroupRecords");
      cy.getByCy("record-group-row").contains(seed.recordGroupName).click();
      cy.getByCy("subheader-title").should("contain", seed.recordGroupName);
      cy.findByRole("columnheader", { name: /record name/i }).should("be.visible");
      waitForRecordGroupRecords("@loadRecordGroupRecords", recordGroup._id, seed.recordName);

      cy.intercept("POST", `${Cypress.env("backendURL")}/get_record/${record._id}`).as("getSeedRecord");
      cy.contains('[data-cy="record-row"]', seed.recordName, { timeout: 30000 }).click();
      waitForRecordFetch("@getSeedRecord", seed.recordName);
      cy.findByRole("columnheader", { name: /field/i, timeout: 30000 }).should("be.visible");
      cy.getByCy("subheader-title").should("contain", seed.recordName);
    });
  });

  it("opens project and team all-records tables", () => {
    cy.fixture("seeded-data").then((seed) => {
      cy.findProjectByName(seed.projectName).then((project) => {
        cy.visitApp(`/project/${project._id}`);
        cy.contains('[data-cy="project-tab"]', "All Records").click();
        cy.contains('[data-cy="project-tab"]', "All Records").should("have.attr", "aria-selected", "true");
        expectRecordsTableShell();

        cy.getByCy("header-tab-records").click();
        cy.location("pathname").should("eq", "/records");
        cy.getByCy("subheader-title").should("contain", "All Records");
        expectRecordsTableShell();
      });
    });
  });
});
