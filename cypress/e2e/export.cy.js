import { strFromU8, unzipSync } from "fflate";

const path = require("path");
const exportUrl = () => `${Cypress.env("backendURL")}/download_records/**`;
const records = [
  { filename: "export-alpha.pdf", depth: 120, operator: "Alpha Oil" },
  { filename: "export-bravo.pdf", depth: 240, operator: "Bravo Oil" },
];

const importGroup = (projectId, name, sourceRecords) => {
  return cy.api("POST", `/import_json_record_group/${projectId}`, {
    record_group: { name, documentType: "Cypress Export" },
    import_package: {
      format: "ogrre-json-records-v1",
      records: sourceRecords.map((record) => ({
        filename: record.filename,
        attributesList: [
          { key: "Depth", value: record.depth, subattributes: [] },
          { key: "Operator", value: record.operator, subattributes: [] },
        ],
      })),
    },
  }).then(({ body }) => {
    expect(body.created_count).to.eq(sourceRecords.length);
    return body;
  });
};

const openExport = (recordGroupId, name) => {
  cy.visitApp(`/record_group/${recordGroupId}`);
  cy.getByCy("subheader-title").should("contain.text", name);
  cy.getByCy("records-export-button").should("be.enabled").click();
  cy.getByCy("export-dialog").should("be.visible");
  cy.getByCy("download-button").should("be.enabled");
};

const openProjectExport = (projectId, groupName) => {
  cy.visitApp(`/project/${projectId}`);
  cy.contains('[data-cy="record-group-row"]', groupName)
    .find('[data-cy="record-group-select"] input').check();
  cy.getByCy("record-groups-export-button").click();
  cy.getByCy("download-button").should("be.enabled");
};

const waitForExport = (format) => {
  cy.wait("@exportRecords", { timeout: 30000 }).then(({ request, response }) => {
    expect(request.url).to.include(`export_${format}=true`);
    expect(request.url).to.include("export_images=false");
    expect(request.url).to.include("export_embedded_pdfs=false");
    expect(response.statusCode).to.eq(200);
    expect(response.headers["content-type"]).to.include("application/zip");
  });
  cy.getByCy("export-dialog").should("not.exist");
};

const readExport = (name, extension) => {
  const filename = path.join(Cypress.config("downloadsFolder"), `${name}.zip`);
  return cy.readFile(filename, null, { timeout: 30000 }).then((bytes) => {
    const entries = unzipSync(new Uint8Array(bytes));
    const filenames = Object.keys(entries);
    expect(filenames, "archive contains only the selected export format").to.have.length(1);
    expect(filenames[0]).to.match(new RegExp(`\\.${extension}$`));
    return strFromU8(entries[filenames[0]]);
  });
};

const expectJsonRecords = (contents) => {
  const exported = JSON.parse(contents);
  expect(exported.map((record) => ({
    filename: record.file,
    depth: record.Depth.value,
    operator: record.Operator.value,
  }))).to.have.deep.members(records);
};

describe("real record exports", () => {
  let projectId;
  let projectName;
  let groupName;
  let group;

  beforeEach(() => {
    cy.clearLocalStorage();
    projectId = null;
    // New names prevent a previous download from satisfying a later test.
    projectName = `Cypress-export-${Date.now()}-${Cypress._.random(100000)}`;
    groupName = `${projectName}-selected`;
    cy.api("POST", "/add_project", { name: projectName, description: "Export E2E test" })
      .then(({ body }) => {
        projectId = body;
        return importGroup(projectId, groupName, records);
      })
      .then((createdGroup) => { group = createdGroup; });
    // Observe the request without replacing the backend response.
    cy.intercept("POST", exportUrl()).as("exportRecords");
  });

  afterEach(() => {
    if (projectId) cy.api("POST", `/delete_project/${projectId}`);
  });

  it("downloads a valid JSON ZIP containing the expected records and values", () => {
    openExport(group.record_group_id, groupName);
    cy.getByCy("download-button").click();
    waitForExport("json");
    readExport(groupName, "json").then(expectJsonRecords);
  });

  it("downloads CSV containing only the selected field and expected records", () => {
    openExport(group.record_group_id, groupName);
    cy.get('[data-export-type="json"] input').uncheck();
    cy.get('[data-export-type="csv"] input').check();
    cy.getByCy("export-select-all-columns").click();
    cy.findByRole("checkbox", { name: "User Notes" }).uncheck();
    cy.get('[data-cy="export-column-label"][data-column="Depth"]').click();
    cy.getByCy("download-button").click();
    waitForExport("csv");
    readExport(groupName, "csv").then((contents) => {
      const [header, ...rows] = contents.trim().split(/\r?\n/);
      expect(header).to.eq("file,Depth,URL");
      expect(rows).to.have.members(records.map((record, index) => (
        `${record.filename},${record.depth},${Cypress.config("baseUrl")}/record/${group.created_record_ids[index]}`
      )));
    });
  });

  it("exports only selected project record groups, excluding another group of the same document type", () => {
    importGroup(projectId, `${projectName}-excluded`, [
      { filename: "excluded.pdf", depth: 999, operator: "Excluded Oil" },
    ]);
    openProjectExport(projectId, groupName);
    cy.getByCy("download-button").click();
    waitForExport("json");
    readExport(projectName, "json").then(expectJsonRecords);
  });

  ["record group", "project"].forEach((location) => {
    it(`shows a ${location} export failure and allows a successful real export on retry`, () => {
      cy.intercept({ method: "POST", url: exportUrl(), times: 1 }, {
        statusCode: 500,
        body: { detail: "Export failed for this test" },
      }).as("failedExport");
      if (location === "project") openProjectExport(projectId, groupName);
      else openExport(group.record_group_id, groupName);
      cy.getByCy("download-button").click();
      cy.wait("@failedExport").its("response.statusCode").should("eq", 500);
      cy.getByCy("export-dialog").should("be.visible");
      cy.findByRole("alert").should("contain.text", "Download failed with status 500");
      cy.getByCy("download-button").should("be.enabled").click();
      waitForExport("json");
      cy.findByRole("alert").should("not.exist");
      readExport(location === "project" ? projectName : groupName, "json").then(expectJsonRecords);
    });
  });
});
