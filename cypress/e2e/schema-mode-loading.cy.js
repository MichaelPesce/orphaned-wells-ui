const expectRecordResponse = (response, expectedRecordName) => {
  expect(response?.statusCode).to.eq(200);
  expect(response?.body.record_count, "record count").to.be.greaterThan(0);
  if (expectedRecordName) {
    expect(response.body.records.map((record) => record.name)).to.include(
      expectedRecordName
    );
  }
};

describe("loading in each schema mode", () => {
  const databaseMode = Boolean(Cypress.env("useDbProcessors"));

  before(() => {
    cy.resetSeedData();
  });

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("reports the configured mode and renders its schema catalog", () => {
    cy.api("GET", "/get_processors").then(({ body }) => {
      expect(body.USE_DB_PROCESSORS).to.eq(databaseMode);
      expect(body.processor_list).to.have.length.greaterThan(0);
    });

    cy.api("GET", "/get_schema").then(({ body }) => {
      expect(body.source).to.eq(databaseMode ? "database" : "repo");
      expect(body.read_only).to.eq(!databaseMode);
      expect(body.processors).to.have.length.greaterThan(0);
    });

    cy.intercept("GET", `${Cypress.env("backendURL")}/get_schema`).as(
      "getSchema"
    );
    cy.visitApp("/schema");
    cy.wait("@getSchema").its("response.statusCode").should("eq", 200);
    cy.getByCy("schema-table", { timeout: 30000 }).should("be.visible");
    cy.getByCy("schema-processor-row").should(($rows) => {
      expect($rows.length).to.be.greaterThan(0);
    });

    if (databaseMode) {
      cy.findByRole("button", { name: "Create schema" }).should("be.visible");
      cy.contains("Repo schemas are read-only").should("not.exist");
    } else {
      cy.contains("Repo schemas are read-only").should("be.visible");
      cy.findByRole("button", { name: "Create schema" }).should("not.exist");
    }
  });

  it("loads projects, record groups, records, and record details", () => {
    cy.findSeededEntities().then(({ seed, project, recordGroup, record }) => {
      cy.intercept("GET", `${Cypress.env("backendURL")}/get_projects`).as(
        "getProjects"
      );
      cy.visitApp("/projects");
      cy.wait("@getProjects").then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(response?.body.map((item) => item.name)).to.include(
          seed.projectName
        );
      });

      cy.intercept(
        "GET",
        `${Cypress.env("backendURL")}/get_record_groups/${project._id}`
      ).as("getRecordGroups");
      cy.getByCy("project-row").contains(seed.projectName).click();
      cy.wait("@getRecordGroups").then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(response?.body.record_groups.map((group) => group.name)).to.include(
          seed.recordGroupName
        );
      });
      cy.getByCy("record-group-row").contains(seed.recordGroupName).should("be.visible");

      cy.intercept(
        "GET",
        `${Cypress.env("backendURL")}/get_record_group/${recordGroup._id}`
      ).as("getRecordGroup");
      cy.intercept(
        "POST",
        `${Cypress.env("backendURL")}/get_records/record_group*`
      ).as("getRecordGroupRecords");
      cy.getByCy("record-group-row").contains(seed.recordGroupName).click();
      cy.wait("@getRecordGroup").then(({ response }) => {
        expect(response?.statusCode).to.eq(200);
        expect(response?.body.rg_data.name).to.eq(seed.recordGroupName);
        expect(response?.body.rg_data.schema_source).to.eq(
          databaseMode ? "database" : "repo"
        );
      });
      cy.wait("@getRecordGroupRecords").then(({ response }) => {
        expectRecordResponse(response, seed.recordName);
      });

      cy.intercept(
        "POST",
        `${Cypress.env("backendURL")}/get_record/${record._id}`
      ).as("getRecord");
      cy.contains('[data-cy="record-row"]', seed.recordName, {
        timeout: 30000,
      }).click();
      cy.wait("@getRecord").then(({ response }) => {
        expect(response?.statusCode).to.be.oneOf([200, 303]);
        expect(response?.body.recordData.name).to.eq(seed.recordName);
        expect(response?.body.recordData.attributesList).to.have.length.greaterThan(
          0
        );
      });
      cy.findByRole("columnheader", { name: /field/i }).should("be.visible");
    });
  });

  it("loads project and team All Records data", () => {
    cy.fixture("seeded-data").then((seed) => {
      cy.findProjectByName(seed.projectName).then((project) => {
        cy.intercept(
          "POST",
          `${Cypress.env("backendURL")}/get_records/project*`
        ).as("getProjectRecords");
        cy.visitApp(`/project/${project._id}`);
        cy.contains('[data-cy="project-tab"]', "All Records").click();
        cy.wait("@getProjectRecords").then(({ response }) => {
          expectRecordResponse(response);
        });

        cy.intercept(
          "POST",
          `${Cypress.env("backendURL")}/get_records/team*`
        ).as("getTeamRecords");
        cy.visitApp("/records");
        cy.wait("@getTeamRecords").then(({ response }) => {
          expectRecordResponse(response);
        });
        cy.getByCy("record-row").should(($rows) => {
          expect($rows.length).to.be.greaterThan(0);
        });
      });
    });
  });
});
