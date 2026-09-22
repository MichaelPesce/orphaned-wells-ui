// Isolated browser contracts; every backend request is intercepted.
describe("Generate schemas from records", () => {
  const groupId = "222222222222222222222222";
  const api = () => Cypress.env("backendURL");
  let group;
  const field = { name: "depth", data_type: "Number", database_data_type: "int", page_order_sort: 1 };

  const setup = (permissions = ["manage_schema"], overrides = {}) => {
    group = { _id: groupId, name: "Imported records", schema_source: "database", schema_id: null, has_schema: false, has_records: true, can_process: false, ...overrides };
    cy.intercept(`${api()}/**`, { statusCode: 404, body: { detail: "Unmocked test request" } });
    cy.mockCheckAuth({ email: "schema-test@example.com", permissions });
    cy.intercept("GET", `${api()}/get_cleaning_functions`, { cleaning_functions: [] });
    cy.intercept("GET", `${api()}/get_record_group/${groupId}`, req => req.reply({ project: { _id: "project", name: "Project" }, rg_data: group }));
    cy.intercept("GET", `${api()}/get_column_data/record_group/${groupId}*`, req => req.reply({ columns: ["depth"], obj: group }));
    cy.intercept("POST", `${api()}/get_records/record_group*`, { records: [], record_count: 1 });
    cy.intercept("POST", `${api()}/record_groups/${groupId}/schema/preview`, req => {
      expect(req.body.mode).to.equal(group.has_schema ? "extend" : "generate");
      req.reply({ preview_id: "saved-preview", mode: req.body.mode, status: "preview", schema_id: group.schema_id, schema_name: "Shared schema", name: "Imported schema", documentType: "Imported records", fields: [field], field_notes: {}, warnings: ["This preview covers a bounded sample."], sampled_records: 1, examined_records: 1, record_limit: 1000, sample_capped: false, oversized_records: 0 });
    });
  };

  it("creates and attaches a processor-free schema and refreshes available actions", () => {
    setup();
    cy.intercept("POST", `${api()}/record_groups/${groupId}/schema/apply`, req => {
      expect(req.body.preview_id).to.equal("saved-preview");
      expect(req.body.fields[0].alias).to.equal("Measured depth");
      expect(req.body).not.to.have.property("processorId");
      group = { ...group, has_schema: true, schema_id: "new", active_schema_id: "new", schema_name: "Imported schema" };
      req.reply(group);
    }).as("applySchema");
    cy.visit(`/record_group/${groupId}`);
    cy.getByCy("subheader-actions").click();
    cy.findByText("Generate schema").click();
    cy.findByText("This preview covers a bounded sample.").should("be.visible");
    cy.findByRole("button", { name: "Edit" }).click();
    cy.getByCy("schema-edit-alias").find("input").type("Measured depth");
    cy.findByRole("button", { name: "Save", exact: true }).click();
    cy.findByRole("button", { name: "Create and attach schema" }).click();
    cy.wait("@applySchema");
    cy.getByCy("schema-generation-dialog").should("not.exist");
    cy.getByCy("subheader-actions").click();
    cy.findByText("Add fields to schema").should("be.visible");
    cy.findByText("Generate schema").should("not.exist");
  });

  it("offers an explicit additive preview for an attached shared schema", () => {
    setup(["manage_schema"], { has_schema: true, schema_id: "shared", active_schema_id: "shared" });
    cy.intercept("POST", `${api()}/record_groups/${groupId}/schema/apply`, req => {
      expect(req.body).to.deep.equal({ preview_id: "saved-preview", fields: [field] });
      req.reply(group);
    }).as("extendSchema");
    cy.visit(`/record_group/${groupId}`);
    cy.getByCy("subheader-actions").click();
    cy.findByText("Add fields to schema").click();
    cy.contains("for every record group using it").should("be.visible");
    cy.findByRole("button", { name: "Add fields to shared schema" }).click();
    cy.wait("@extendSchema");
    cy.getByCy("schema-generation-dialog").should("not.exist");
  });

  [
    [[], {}],
    [["manage_schema"], { schema_source: "repo" }],
    [["manage_schema"], { has_records: false }],
  ].forEach(([permissions, overrides], index) => {
    it(`hides generation for unavailable state ${index + 1}`, () => {
      setup(permissions, overrides);
      cy.visit(`/record_group/${groupId}`);
      cy.getByCy("subheader-actions").click();
      cy.findByText("Generate schema").should("not.exist");
      cy.findByText("Add fields to schema").should("not.exist");
    });
  });
});
