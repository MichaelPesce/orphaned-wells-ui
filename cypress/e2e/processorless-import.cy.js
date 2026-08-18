const IMPORT_FIXTURE = "cypress/fixtures/files/processorless-records.json";
const IMPORTED_RECORDS = [
  {
    name: "CYPRESS_JSON_IMPORT_ALPHA",
    filename: "cypress-json-import-alpha.pdf",
    operatorName: "Acadiana Oil & Environmental",
  },
  {
    name: "CYPRESS_JSON_IMPORT_BRAVO",
    filename: "cypress-json-import-bravo.pdf",
    operatorName: "Bayou State Disposal",
  },
  {
    name: "CYPRESS_JSON_IMPORT_CHARLIE",
    filename: "cypress-json-import-charlie.pdf",
    operatorName: "Coastal Remediation Services",
  },
];

const ONE_PIXEL_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

const uniqueName = (base) => `${base} ${Date.now()} ${Cypress._.random(100000)}`;

const backendRoute = (route) => `${Cypress.env("backendURL")}${route}`;

const parseRequestBody = (body) => {
  return typeof body === "string" ? JSON.parse(body) : body;
};

const createProcessorlessRecordGroup = (projectId, name) => {
  return cy.api("POST", "/add_record_group", {
    name,
    description: "Created by Cypress E2E.",
    history: [],
    project_id: projectId,
    documentType: "Unspecified",
    processorId: null,
    processor_id: null,
    source_type: "processorless",
    attributes: [],
  }).its("body");
};

const getSeedProject = () => {
  return cy.fixture("seeded-data").then((seed) => cy.findProjectByName(seed.projectName));
};

describe("processorless record import workflows", () => {
  let recordGroupsToCleanup = [];

  beforeEach(() => {
    cy.clearLocalStorage();
  });

  afterEach(() => {
    const names = [...recordGroupsToCleanup];
    recordGroupsToCleanup = [];
    if (!names.length) return;

    getSeedProject().then((project) => {
      names.forEach((name) => {
        cy.cleanupRecordGroupByName(project._id, name);
      });
    });
  });

  it("creates a processorless record group from an OGRRE JSON export", () => {
    const recordGroupName = uniqueName("Cypress JSON Record Group");
    recordGroupsToCleanup.push(recordGroupName);

    getSeedProject().then((project) => {
      cy.cleanupRecordGroupByName(project._id, recordGroupName);
      cy.visitApp(`/project/${project._id}`);
      cy.getByCy("subheader-actions").click();
      cy.contains('[data-cy="subheader-action-item"]', "Import JSON/CSV record group").click();
      cy.getByCy("json-import-dialog").should("be.visible");
      cy.getByCy("json-import-record-group-name").find("input").type(recordGroupName);
      cy.getByCy("json-import-document-type").find("input").clear().type("Cypress JSON Export");
      cy.getByCy("json-import-record-group-description").find("textarea").first().type("Imported from a Cypress JSON fixture.");

      cy.intercept("POST", backendRoute(`/preview_record_file_record_group/${project._id}`)).as("previewRecordGroupImport");
      cy.getByCy("json-import-dropzone").selectFile(IMPORT_FIXTURE, { action: "drag-drop" });
      cy.wait("@previewRecordGroupImport").then(({ response }) => {
        expect(response.statusCode).to.eq(200);
        expect(response.body.record_count).to.eq(IMPORTED_RECORDS.length);
        expect(response.body.importable_count).to.eq(IMPORTED_RECORDS.length);
        expect(response.body.skipped_duplicate_count).to.eq(0);
      });
      cy.getByCy("json-import-preview")
        .should("contain", `${IMPORTED_RECORDS.length} records found`)
        .and("contain", "No duplicates found");

      cy.intercept("POST", backendRoute(`/import_record_file_record_group/${project._id}`)).as("importRecordGroup");
      cy.getByCy("json-import-submit").click();
      cy.wait("@importRecordGroup").then(({ response }) => {
        expect(response.statusCode).to.eq(200);
        expect(response.body.created_count).to.eq(IMPORTED_RECORDS.length);
        expect(response.body.skipped_duplicate_count).to.eq(0);
        const recordGroupId = response.body.record_group_id;

        cy.location("pathname", { timeout: 10000 }).should("eq", `/record_group/${recordGroupId}`);
        cy.getByCy("subheader-title", { timeout: 10000 }).should("contain", recordGroupName);
        cy.api("GET", `/get_record_group/${recordGroupId}`).then(({ body }) => {
          expect(body.rg_data.name).to.eq(recordGroupName);
          expect(body.rg_data.processorId).to.eq(null);
          expect(body.rg_data.source_type).to.eq("json_import");
          expect(body.rg_data.documentType).to.eq("Cypress JSON Export");
        });
        cy.getRecordsFor("record_group", recordGroupId).then(({ records, record_count: recordCount }) => {
          expect(recordCount).to.eq(IMPORTED_RECORDS.length);
          const importedNames = records.map((record) => record.name);
          IMPORTED_RECORDS.forEach((expectedRecord) => {
            expect(importedNames).to.include(expectedRecord.name);
          });
        });
      });
    });
  });

  it("imports JSON records into a processorless group, previews duplicates, and uploads a record image", () => {
    const recordGroupName = uniqueName("Cypress Processorless Import");
    recordGroupsToCleanup.push(recordGroupName);

    getSeedProject().then((project) => {
      cy.cleanupRecordGroupByName(project._id, recordGroupName);
      createProcessorlessRecordGroup(project._id, recordGroupName).then((recordGroupId) => {
        cy.visitApp(`/record_group/${recordGroupId}`);
        cy.getByCy("subheader-primary-action").should("contain", "Import JSON/CSV records").click();

        cy.intercept("POST", backendRoute(`/preview_record_file_records/${recordGroupId}`)).as("previewAppendImport");
        cy.getByCy("json-import-dropzone").selectFile(IMPORT_FIXTURE, { action: "drag-drop" });
        cy.wait("@previewAppendImport").then(({ response }) => {
          expect(response.statusCode).to.eq(200);
          expect(response.body.record_count).to.eq(IMPORTED_RECORDS.length);
          expect(response.body.importable_count).to.eq(IMPORTED_RECORDS.length);
          expect(response.body.skipped_duplicate_count).to.eq(0);
        });
        cy.getByCy("json-import-preview").should("contain", "No duplicates found");

        cy.intercept("POST", backendRoute(`/import_record_file_records/${recordGroupId}`)).as("appendImport");
        cy.getByCy("json-import-submit").click();
        cy.wait("@appendImport").then(({ response }) => {
          expect(response.statusCode).to.eq(200);
          expect(response.body.created_count).to.eq(IMPORTED_RECORDS.length);
          expect(response.body.created_record_ids).to.have.length(IMPORTED_RECORDS.length);
        });

        IMPORTED_RECORDS.forEach((expectedRecord) => {
          cy.contains('[data-cy="record-row"]', expectedRecord.name, { timeout: 30000 }).should("be.visible");
        });

        cy.getRecordsFor("record_group", recordGroupId).then(({ records, record_count: recordCount }) => {
          expect(recordCount).to.eq(IMPORTED_RECORDS.length);
          const alphaRecord = records.find((record) => record.name === IMPORTED_RECORDS[0].name);
          expect(alphaRecord, "imported alpha record").to.not.equal(undefined);
          expect(alphaRecord.filename).to.eq(IMPORTED_RECORDS[0].filename);
          const operatorName = alphaRecord.attributesList.find((attribute) => attribute.key === "operator_name");
          expect(operatorName.value).to.eq(IMPORTED_RECORDS[0].operatorName);
        });

        cy.getByCy("subheader-primary-action").click();
        cy.getByCy("json-import-dropzone").selectFile(IMPORT_FIXTURE, { action: "drag-drop" });
        cy.wait("@previewAppendImport").then(({ response }) => {
          expect(response.statusCode).to.eq(200);
          expect(response.body.record_count).to.eq(IMPORTED_RECORDS.length);
          expect(response.body.importable_count).to.eq(0);
          expect(response.body.existing_duplicate_count).to.eq(IMPORTED_RECORDS.length);
          expect(response.body.skipped_duplicate_count).to.eq(IMPORTED_RECORDS.length);
        });
        cy.getByCy("json-import-preview")
          .should("contain", `${IMPORTED_RECORDS.length} duplicates will be skipped`)
          .and("contain", "0 records will be imported");

        cy.getByCy("json-import-prevent-duplicates").find("input").uncheck({ force: true });
        cy.wait("@previewAppendImport").then(({ response }) => {
          expect(response.statusCode).to.eq(200);
          expect(response.body.importable_count).to.eq(IMPORTED_RECORDS.length);
          expect(response.body.existing_duplicate_count).to.eq(IMPORTED_RECORDS.length);
          expect(response.body.skipped_duplicate_count).to.eq(0);
          expect(response.body.prevent_duplicates).to.eq(false);
        });
        cy.getByCy("json-import-preview").should("contain", `${IMPORTED_RECORDS.length} duplicates found, but duplicate prevention is off`);
        cy.contains("button", "Cancel").click();

        cy.findRecordByName(recordGroupId, IMPORTED_RECORDS[0].name).then((record) => {
          cy.visitApp(`/record/${record._id}`);
          cy.contains('[data-cy="attribute-row"]', "operator_name", { timeout: 30000 })
            .should("contain", IMPORTED_RECORDS[0].operatorName);
          cy.getByCy("subheader-actions").click();
          cy.contains('[data-cy="subheader-action-item"]', "Upload record image(s)").click();
          cy.getByCy("record-image-upload-dialog").should("be.visible");
          cy.getByCy("record-image-dropzone").selectFile(
            {
              contents: Cypress.Buffer.from(ONE_PIXEL_PNG, "base64"),
              fileName: "processorless-record-image.png",
              mimeType: "image/png",
            },
            { action: "drag-drop" }
          );
          cy.getByCy("record-image-upload-preview").should("contain", "1 file ready to upload");

          cy.intercept("POST", backendRoute(`/upload_record_images/${record._id}`)).as("uploadRecordImages");
          cy.getByCy("record-image-upload-submit").click();
          cy.wait("@uploadRecordImages").then(({ response }) => {
            expect(response.statusCode).to.eq(200);
            expect(response.body.record_id).to.eq(record._id);
            expect(response.body.image_files).to.have.length(1);
            expect(response.body.img_urls).to.have.length(1);
            expect(response.body.img_urls[0]).to.include("/local-storage/uploads/");
          });
          cy.getByCy("record-image-upload-dialog").should("not.exist");
          cy.getRecordsFor("record_group", recordGroupId).then(({ records }) => {
            const updatedRecord = records.find((candidate) => candidate._id === record._id);
            expect(updatedRecord, "record after image upload").to.not.equal(undefined);
            expect(updatedRecord.image_files).to.have.length(1);
          });
        });
      });
    });
  });

  it("connects a processor to an existing processorless record group", () => {
    const recordGroupName = uniqueName("Cypress Connect Processor");
    recordGroupsToCleanup.push(recordGroupName);

    getSeedProject().then((project) => {
      cy.cleanupRecordGroupByName(project._id, recordGroupName);
      createProcessorlessRecordGroup(project._id, recordGroupName).then((recordGroupId) => {
        cy.visitApp(`/record_group/${recordGroupId}`);
        cy.getByCy("subheader-primary-action").should("contain", "Import JSON/CSV records");
        cy.getByCy("subheader-actions").click();
        cy.contains('[data-cy="subheader-action-item"]', "Connect processor").click();
        cy.getByCy("connect-processor-dialog").should("be.visible");
        cy.getByCy("connect-processor-option").first().click();

        cy.intercept("POST", backendRoute(`/connect_record_group_processor/${recordGroupId}`)).as("connectProcessor");
        cy.getByCy("connect-processor-submit").click();
        cy.wait("@connectProcessor").then(({ request, response }) => {
          const requestBody = parseRequestBody(request.body);
          expect(response.statusCode).to.eq(200);
          expect(requestBody.processorId).to.be.a("string");
          expect(requestBody.processorId.length).to.be.greaterThan(0);
          expect(response.body.processorId).to.eq(requestBody.processorId);
          expect(response.body._id).to.eq(recordGroupId);
        });

        cy.getByCy("connect-processor-dialog").should("not.exist");
        cy.getByCy("subheader-primary-action").should("contain", "Upload new record(s)");
        cy.getByCy("subheader-actions").click();
        cy.contains('[data-cy="subheader-action-item"]', "Connect processor").should("be.visible");
        cy.api("GET", `/get_record_group/${recordGroupId}`).then(({ body }) => {
          expect(body.rg_data.processorId).to.be.a("string");
          expect(body.rg_data.processorId.length).to.be.greaterThan(0);
          expect(body.rg_data.attributes).to.be.an("array");
        });
      });
    });
  });
});
