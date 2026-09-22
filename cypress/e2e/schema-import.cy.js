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

  it("requires an Add conflict decision before a schema manager can apply", () => {
    setup(["manage_schema"]);
    cy.intercept("POST", `${api()}/preview_repo_schema_import`, req => {
      if (req.body.decisions.Well) {
        expect(req.body.decisions.Well).to.deep.equal({ action: "keep", schema_id: "existing" });
        req.reply({ ...plan, counts: { ...plan.counts, added: 0, kept: 1 }, entries: [{ ...plan.entries[0], action: "kept" }] });
      } else req.reply({ ...plan, can_apply: false, counts: { ...plan.counts, added: 0, conflict: 1 }, entries: [{ ...plan.entries[0], action: "conflict", candidates: [{ schema_id: "existing", name: "Current Well", diff, groups: [] }] }] });
    });
    cy.intercept("POST", `${api()}/apply_repo_schema_import`, req => {
      expect(req.body).to.deep.equal({ import_id: "saved-preview" });
      req.reply({ ...plan, status: "complete" });
    }).as("applyImport");
    open();
    cy.findByLabelText("Replace the schema catalog").should("be.disabled");
    cy.findByRole("button", { name: "Preview import" }).click();
    cy.findByRole("button", { name: "Continue" }).should("be.disabled");
    cy.findByLabelText("Decision for Well").click();
    cy.findByRole("option", { name: "Keep existing" }).click();
    cy.findByRole("button", { name: "Update preview" }).click();
    cy.findByRole("button", { name: "Continue" }).click();
    cy.findByRole("button", { name: "Import selected schemas" }).click();
    cy.wait("@applyImport");
    cy.contains("Schema import complete.").should("be.visible");
  });

  it("warns about cross-team detachment before Replace and retains a partial import for retry", () => {
    setup(["manage_schema", "manage_schema_destructive"]);
    const replacement = { ...plan, mode: "replace", destructive: true, counts: { ...plan.counts, removed: 1, detached: 1 },
      removed: [{ schema_id: "old", name: "Old schema", groups: [group] }], affected_groups: [group], detached_groups: [group] };
    cy.intercept("POST", `${api()}/preview_repo_schema_import`, replacement);
    let attempt = 0;
    cy.intercept("POST", `${api()}/apply_repo_schema_import`, req => {
      expect(req.body).to.deep.equal({ import_id: "saved-preview" });
      attempt += 1;
      req.reply({ ...replacement, status: attempt === 1 ? "partial" : "complete", error: attempt === 1 ? "Import paused. Retry to continue." : null });
    }).as("applyImport");
    open();
    cy.findByLabelText("Replace the schema catalog").click();
    cy.findByRole("button", { name: "Preview import" }).click();
    cy.contains("Their records and stored fields are preserved.").should("be.visible");
    cy.findByRole("button", { name: "Record groups to detach (1)" }).click().closest(".MuiAccordion-root").within(() => {
      cy.contains("Other team records · Other team").should("be.visible");
    });
    cy.findByRole("button", { name: "Continue" }).click();
    cy.findByRole("button", { name: "Replace schemas and detach 1 group" }).click();
    cy.wait("@applyImport");
    cy.contains("Import paused. Retry to continue.").should("be.visible");
    cy.findByRole("button", { name: "Resume import" }).click();
    cy.wait("@applyImport");
    cy.contains("Schema import complete.").should("be.visible");
  });
});
