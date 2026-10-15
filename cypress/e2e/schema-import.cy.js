// Isolated browser contracts: these requests never reach an application database.
describe("Import repo schemas", () => {
  const source = { package: "ogrre_data_cleaning", version: "1.2", collaborator: "isgs" };
  const group = { id: "group", name: "Other team records", team: "Other team" };
  const diff = { added: ["new_field"], retired: ["depth"], changed: [], metadata: [] };
  const plan = {
    import_id: "saved-preview", source, mode: "add", status: "preview", can_apply: true, destructive: false,
    counts: { added: 1, updated: 0, removed: 0, detached: 0, unchanged: 0, kept: 0, conflict: 0 },
    entries: [{ source_id: "Well", name: "Well", action: "added", candidates: [], groups: [], diff }],
    removed: [], affected_groups: [], detached_groups: [], errors: [], next_step: 0, total_steps: 1,
  };
  const api = () => Cypress.env("backendURL");
  const setup = permissions => {
    cy.intercept(`${api()}/**`, { statusCode: 404, body: { detail: "Unmocked test request" } });
    cy.mockCheckAuth({ email: "schema-test@example.com", permissions });
    cy.intercept("GET", `${api()}/get_schema`, { processors: [], source: "database", read_only: false });
    cy.intercept("GET", `${api()}/get_cleaning_functions`, { cleaning_functions: [] });
    cy.intercept("GET", `${api()}/get_repo_schema_import`, { source, schemas: [{ source_id: "Well", name: "Well", field_count: 1 }], busy: false });
  };
  const open = () => {
    cy.visit("/schema");
    cy.getByCy("subheader-actions").click();
    cy.findByText("Import repo schemas").click();
    cy.findByLabelText("Well · 1 fields").should("be.checked");
  };

  it("allows refresh preview for schema managers without destructive permission", () => {
    setup(["manage_schema"]);
    open();
    cy.findByLabelText("Refresh from repo (recommended)").should("be.enabled");
    cy.findByRole("button", { name: "Preview import" }).should("be.enabled");
  });

  it("previews and applies schema refresh and retains a partial import for retry", () => {
    setup(["manage_schema"]);
    const refreshPlan = {
      ...plan,
      mode: "refresh",
      destructive: false,
      counts: { ...plan.counts, added: 0, updated: 1, removed: 0 },
      entries: [{ source_id: "Well", name: "Well", action: "updated", candidates: [{ schema_id: "existing", name: "Well", diff, groups: [] }], groups: [], diff }],
    };
    cy.intercept("POST", `${api()}/preview_repo_schema_import`, refreshPlan);
    let attempt = 0;
    cy.intercept("POST", `${api()}/apply_repo_schema_import`, req => {
      expect(req.body).to.deep.equal({ import_id: "saved-preview" });
      attempt += 1;
      req.reply({ ...refreshPlan, status: attempt === 1 ? "partial" : "complete", error: attempt === 1 ? "Import paused. Retry to continue." : null });
    }).as("applyImport");
    open();
    cy.findByLabelText("Refresh from repo (recommended)").should("be.checked");
    cy.findByRole("button", { name: "Preview import" }).click();
    cy.contains("Refreshing schemas will update matching schemas in place").should("be.visible");
    cy.findByRole("button", { name: "Continue" }).click();
    cy.findByRole("button", { name: "Refresh schemas from repo" }).click();
    cy.wait("@applyImport");
    cy.contains("Import paused. Retry to continue.").should("exist");
    cy.findByRole("button", { name: "Resume import" }).click();
    cy.wait("@applyImport");
    cy.contains("Schema import complete.").should("exist");
  });
});
