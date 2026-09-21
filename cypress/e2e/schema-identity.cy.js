// Browser contract checks use mocked APIs and never modify an application database.
describe("Shared schema identity", () => {
  const schemaId = "111111111111111111111111";
  const groupId = "222222222222222222222222";
  const schema = { schema_id: schemaId, name: "Imported wells", displayName: "Imported wells", documentType: "Well", attributes: [] };
  let schemas;
  let group;
  const api = () => Cypress.env("backendURL");

  beforeEach(() => {
    schemas = [schema];
    group = { _id: groupId, name: "Test records", schema_id: schemaId, active_schema_id: schemaId, schema_source: "database", has_schema: true, can_process: false };
    cy.intercept(`${api()}/**`, { statusCode: 404, body: { detail: "Unmocked test request" } });
    cy.mockCheckAuth({ email: "schema-test@example.com", permissions: ["manage_schema", "manage_schema_destructive", "manage_project", "clean_record", "upload_document", "create_record_group"] });
    cy.intercept("GET", `${api()}/get_schema`, req => req.reply({ processors: schemas, source: "database", read_only: false }));
    cy.intercept("GET", `${api()}/get_cleaning_functions`, { cleaning_functions: [] });
    cy.intercept("GET", `${api()}/get_processors`, { USE_DB_PROCESSORS: true, processor_list: [schema] });
    cy.intercept("GET", `${api()}/get_record_group/${groupId}`, req => req.reply({ project: { _id: "project", name: "Project" }, rg_data: group }));
    cy.intercept("GET", `${api()}/get_column_data/record_group/${groupId}*`, req => req.reply({ columns: [], obj: group }));
    cy.intercept("POST", `${api()}/get_records/record_group*`, req => {
      if (!group.has_schema) req.alias = "detachedRecords";
      req.reply({ records: [], record_count: 0 });
    });
  });

  it("creates an empty schema without a processor", () => {
    cy.intercept("POST", `${api()}/create_schema`, req => {
      expect(req.body.processorId).to.equal(null);
      expect(req.body.modelId).to.equal(null);
      expect(req.body.attributes).to.deep.equal([]);
      schemas = [...schemas, { ...req.body, schema_id: "333333333333333333333333" }];
      req.reply(schemas[1]);
    }).as("createSchema");
    cy.visit("/schema");
    cy.findByRole("button", { name: "Create schema" }).click();
    cy.findByRole("textbox", { name: "Schema Name" }).type("New schema");
    cy.findByRole("textbox", { name: "Display Name" }).type("New schema");
    cy.findByRole("textbox", { name: "Document Type" }).type("Imported");
    cy.findByRole("button", { name: "Submit" }).click();
    cy.wait("@createSchema");
    cy.findByRole("tab", { name: "New schema" }).should("be.visible");
  });

  it("detaches a schema explicitly and hides unavailable cleaning actions", () => {
    cy.intercept("POST", `${api()}/update_record_group/${groupId}`, req => {
      expect(req.body).to.deep.equal({ schema_id: null });
      group = { ...group, schema_id: null, active_schema_id: null, has_schema: false };
      req.reply(group);
    }).as("detachSchema");
    cy.visit(`/record_group/${groupId}`);
    cy.getByCy("subheader-actions").click();
    cy.findByText("Select schema").click();
    cy.findByRole("button", { name: "No schema" }).click();
    cy.contains("Its records and stored fields are preserved.").should("be.visible");
    cy.findByRole("button", { name: "Detach schema" }).click();
    cy.wait("@detachSchema");
    cy.wait("@detachedRecords");
    cy.getByCy("subheader-primary-action").should("contain", "Import JSON/CSV records");
    cy.getByCy("subheader-actions").click();
    cy.findByText("Clean records").should("not.exist");
  });

  it("shows repo schemas read-only", () => {
    cy.intercept("GET", `${api()}/get_schema`, { processors: [schema], source: "repo", read_only: true });
    cy.visit("/schema");
    cy.contains("Repo schemas are read-only").should("be.visible");
    cy.findByRole("button", { name: "Create schema" }).should("not.exist");
  });
});
