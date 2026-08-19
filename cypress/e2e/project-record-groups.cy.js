const uniqueName = (base) => `${base} ${Date.now()}`;

const parseRequestBody = (body) => {
  return typeof body === "string" ? JSON.parse(body) : body;
};

describe("project and record group management", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("creates, renames, and deletes a project created by the test", () => {
    const projectName = uniqueName("Cypress Project");
    const renamedProjectName = `${projectName} Renamed`;

    cy.cleanupProjectByName(projectName);
    cy.cleanupProjectByName(renamedProjectName);

    cy.visitApp("/projects");
    cy.getByCy("subheader-primary-action").click();
    cy.getByCy("project-name-input").find("input").type(projectName);
    cy.getByCy("project-description-input").find("textarea").first().type("Created by Cypress E2E.");

    cy.intercept("POST", `${Cypress.env("backendURL")}/add_project`).as("createProject");
    cy.getByCy("create-project-button").click();
    cy.wait("@createProject").its("response.statusCode").should("eq", 200);
    cy.getByCy("subheader-title", { timeout: 10000 }).should("contain", projectName);

    cy.getByCy("subheader-actions").click();
    cy.contains('[data-cy="subheader-action-item"]', "Change project name").click();
    cy.getByCy("popup-input").find("input").clear().type(renamedProjectName);
    cy.intercept("POST", `${Cypress.env("backendURL")}/update_project/**`).as("updateProject");
    cy.getByCy("popup-primary-button").click();
    cy.wait("@updateProject").its("response.statusCode").should("eq", 200);
    cy.getByCy("subheader-title", { timeout: 10000 }).should("contain", renamedProjectName);

    cy.getByCy("subheader-actions").click();
    cy.contains('[data-cy="subheader-action-item"]', "Delete project").click();
    cy.intercept("POST", `${Cypress.env("backendURL")}/delete_project/**`).as("deleteProject");
    cy.getByCy("popup-primary-button").click();
    cy.wait("@deleteProject").its("response.statusCode").should("eq", 200);
    cy.location("pathname").should("eq", "/projects");
    cy.getByCy("project-row").should("not.contain", renamedProjectName);

    cy.cleanupProjectByName(projectName);
    cy.cleanupProjectByName(renamedProjectName);
  });

  it("creates, renames, and deletes a record group created by the test", () => {
    const recordGroupName = uniqueName("Cypress Record Group");
    const renamedRecordGroupName = `${recordGroupName} Renamed`;

    cy.fixture("seeded-data").then((seed) => cy.findProjectByName(seed.projectName)).then((project) => {
      cy.cleanupRecordGroupByName(project._id, recordGroupName);
      cy.cleanupRecordGroupByName(project._id, renamedRecordGroupName);

      cy.visitApp(`/project/${project._id}`);
      cy.getByCy("subheader-primary-action").click();
      cy.getByCy("record-group-name-input").find("input").type(recordGroupName);
      cy.getByCy("record-group-description-input").find("textarea").first().type("Created by Cypress E2E.");
      cy.getByCy("processor-option").first().click();

      cy.intercept("POST", `${Cypress.env("backendURL")}/add_record_group`).as("createRecordGroup");
      cy.getByCy("create-record-group-button").click();
      cy.wait("@createRecordGroup").its("response.statusCode").should("eq", 200);
      cy.getByCy("subheader-title", { timeout: 10000 }).should("contain", recordGroupName);

      cy.getByCy("subheader-actions").click();
      cy.contains('[data-cy="subheader-action-item"]', "Change record group name").click();
      cy.getByCy("popup-input").find("input").clear().type(renamedRecordGroupName);
      cy.intercept("POST", `${Cypress.env("backendURL")}/update_record_group/**`).as("updateRecordGroup");
      cy.getByCy("popup-primary-button").click();
      cy.wait("@updateRecordGroup").its("response.statusCode").should("eq", 200);
      cy.getByCy("subheader-title", { timeout: 10000 }).should("contain", renamedRecordGroupName);

      cy.getByCy("subheader-actions").click();
      cy.contains('[data-cy="subheader-action-item"]', "Delete record group").click();
      cy.intercept("POST", `${Cypress.env("backendURL")}/delete_record_group/**`).as("deleteRecordGroup");
      cy.getByCy("popup-primary-button").click();
      cy.wait("@deleteRecordGroup").its("response.statusCode").should("eq", 200);
      cy.location("pathname").should("eq", `/project/${project._id}`);
      cy.getByCy("record-group-row").should("not.contain", renamedRecordGroupName);

      cy.cleanupRecordGroupByName(project._id, recordGroupName);
      cy.cleanupRecordGroupByName(project._id, renamedRecordGroupName);
    });
  });

  it("creates and deletes a record group without selecting a processor", () => {
    const recordGroupName = uniqueName("Cypress Processorless Record Group");

    cy.fixture("seeded-data").then((seed) => cy.findProjectByName(seed.projectName)).then((project) => {
      cy.cleanupRecordGroupByName(project._id, recordGroupName);

      cy.visitApp(`/project/${project._id}`);
      cy.getByCy("subheader-primary-action").click();
      cy.getByCy("new-record-group-dialog").should("be.visible");
      cy.contains("Create without processor").should("not.exist");
      cy.getByCy("record-group-name-input").find("input").type(recordGroupName);
      cy.getByCy("record-group-description-input").find("textarea").first().type("Created without a processor by Cypress E2E.");

      cy.intercept("POST", `${Cypress.env("backendURL")}/add_record_group`).as("createRecordGroup");
      cy.getByCy("create-record-group-button").click();
      cy.wait("@createRecordGroup").then(({ request, response }) => {
        const body = parseRequestBody(request.body);
        expect(response.statusCode).to.eq(200);
        expect(body.name).to.eq(recordGroupName);
        expect(body.processorId).to.eq(null);
        expect(body.source_type).to.eq("processorless");
      });

      cy.getByCy("subheader-title", { timeout: 10000 }).should("contain", recordGroupName);
      cy.location("pathname").then((pathname) => {
        const recordGroupId = pathname.split("/").pop();
        cy.api("GET", `/get_record_group/${recordGroupId}`).then(({ body }) => {
          expect(body.rg_data.name).to.eq(recordGroupName);
          expect(body.rg_data.processorId).to.eq(null);
          expect(body.rg_data.source_type).to.eq("processorless");
        });
      });

      cy.cleanupRecordGroupByName(project._id, recordGroupName);
    });
  });
});
