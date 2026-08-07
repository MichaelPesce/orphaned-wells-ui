describe("core navigation smoke", () => {
  before(() => {
    cy.resetSeedData();
  });

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  it("loads seeded data and navigates projects to project to record group to record", () => {
    cy.findSeededEntities().then(({ seed }) => {
      cy.visitApp("/projects");

      cy.getByCy("project-row").contains(seed.projectName).click();
      cy.getByCy("subheader-title").should("contain", seed.projectName);
      cy.findByRole("columnheader", { name: /record group name/i }).should("be.visible");

      cy.getByCy("record-group-row").contains(seed.recordGroupName).click();
      cy.getByCy("subheader-title").should("contain", seed.recordGroupName);
      cy.findByRole("columnheader", { name: /record name/i }).should("be.visible");

      cy.getByCy("record-row").contains(seed.recordName).click();
      cy.findByRole("columnheader", { name: /field/i, timeout: 30000 }).should("be.visible");
      cy.getByCy("subheader-title").should("contain", seed.recordName);
    });
  });

  it("opens project and team all-records tables", () => {
    cy.findSeededEntities().then(({ project }) => {
      cy.visitApp(`/project/${project._id}`);
      cy.contains('[data-cy="project-tab"]', "All Records").click();
      cy.findByRole("columnheader", { name: /record name/i }).should("be.visible");
      cy.getByCy("record-row").should("exist");

      cy.getByCy("header-tab-records").click();
      cy.location("pathname").should("eq", "/records");
      cy.getByCy("subheader-title").should("contain", "All Records");
      cy.findByRole("columnheader", { name: /record name/i }).should("be.visible");
    });
  });
});
