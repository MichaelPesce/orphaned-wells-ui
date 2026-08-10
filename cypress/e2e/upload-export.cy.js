const path = require("path");

const openRecordGroupUploadModal = () => {
  cy.intercept("GET", `${Cypress.env("backendURL")}/check_processor_status/**`, {
    statusCode: 200,
    body: 1,
  }).as("checkProcessorStatus");

  return cy.findSeededEntities().then(({ recordGroup }) => {
    cy.visitApp(`/record_group/${recordGroup._id}`);
    cy.getByCy("subheader-primary-action").click();
    cy.wait("@checkProcessorStatus");
    return cy.getByCy("upload-documents-modal").should("exist").then(() => recordGroup);
  });
};

const mockDownload = (alias = "downloadRecords") => {
  cy.intercept("POST", `${Cypress.env("backendURL")}/download_records/**`, {
    statusCode: 200,
    headers: {
      "content-type": "application/zip",
    },
    body: "mock zip content",
  }).as(alias);
};

describe("upload and export workflows", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });
  // 08/10/2026: skip upload tests. They require a processor being in the "deployed" state
  it.skip("opens upload modal and validates unsupported and oversized files", () => {
    openRecordGroupUploadModal();

    cy.getByCy("upload-dropzone").selectFile("cypress/fixtures/files/unsupported.txt", {
      action: "drag-drop",
    });
    cy.contains("Unsupported file type").should("be.visible");

    cy.getByCy("upload-dropzone").selectFile(
      {
        contents: Cypress.Buffer.alloc(11 * 1024 * 1024),
        fileName: "large.pdf",
        mimeType: "application/pdf",
      },
      { action: "drag-drop" }
    );
    cy.contains("File too large").should("be.visible");

    cy.getByCy("upload-run-cleaning-toggle").should("contain.text", "Run cleaning functions");
  });

  it.skip("reviews local-directory upload controls and duplicate prevention", () => {
    openRecordGroupUploadModal();

    cy.intercept("POST", `${Cypress.env("backendURL")}/check_if_records_exist/**`, {
      statusCode: 200,
      body: ["duplicate"],
    }).as("checkDuplicates");

    cy.getByCy("local-directory-button").click({ force: true });
    cy.getByCy("local-directory-input").selectFile(
      [
        {
          contents: Cypress.Buffer.from("pdf"),
          fileName: "cypress-directory/duplicate.pdf",
          mimeType: "application/pdf",
        },
        {
          contents: Cypress.Buffer.from("pdf"),
          fileName: "cypress-directory/new-record.pdf",
          mimeType: "application/pdf",
        },
      ],
      { force: true }
    );

    cy.wait("@checkDuplicates").its("response.statusCode").should("eq", 200);
    cy.contains(/files to be uploaded/i).should("be.visible");
    cy.getByCy("directory-prevent-duplicates-toggle").should("contain.text", "Prevent Duplicates");
    cy.getByCy("directory-run-cleaning-toggle").should("contain.text", "Run cleaning functions");
    cy.getByCy("directory-upload-button").should("be.enabled");
  });

  it.skip("validates and submits mocked GCS directory uploads", () => {
    openRecordGroupUploadModal();
    cy.getByCy("gcs-directory-button").click();

    cy.getByCy("gcs-start-batch-button").should("be.disabled");
    cy.getByCy("gcs-bucket-input").find("input").type("gs://bad-bucket/path");
    cy.getByCy("gcs-check-path-button").click();
    cy.contains("Enter only the bucket name").should("be.visible");

    cy.getByCy("gcs-bucket-input").find("input").clear().type("ogrre-cypress-bucket");
    cy.getByCy("gcs-prefix-input").find("input").type("incoming/wells");

    cy.intercept("POST", `${Cypress.env("backendURL")}/batch_process_documents/**/check_gcs_path`, {
      statusCode: 200,
      body: {
        bucketName: "ogrre-cypress-bucket",
        normalizedPrefix: "incoming/wells/",
        totalFiles: 3,
        totalBatches: 1,
        totalLroWaves: 1,
        duplicateCount: 1,
        nonDuplicateCount: 2,
        totalFilesToSubmit: 2,
        totalBatchesToSubmit: 1,
        totalLroWavesToSubmit: 1,
        preventDuplicates: true,
      },
    }).as("checkGcsPath");

    cy.getByCy("gcs-check-path-button").click();
    cy.wait("@checkGcsPath").its("response.statusCode").should("eq", 200);
    cy.contains("3 supported files found").should("be.visible");
    cy.contains("2 files will be submitted").should("be.visible");

    // 08/10/2026: we do not want to actually run any batch jobs.
    // cy.intercept("POST", `${Cypress.env("backendURL")}/batch_process_documents/**`, {
    //   statusCode: 200,
    //   body: { job_id: "cypress-job-1" },
    // }).as("startBatch");

    // cy.getByCy("gcs-start-batch-button").click();
    // cy.wait("@startBatch").its("response.statusCode").should("eq", 200);
    // cy.contains("Job ID: cypress-job-1").should("be.visible");
  });

  it("exports JSON, CSV, selected columns, and selected project record groups", () => {
    cy.findSeededEntities().then(({ seed, project, recordGroup }) => {
      cy.visitApp(`/record_group/${recordGroup._id}`);

      mockDownload("jsonExport");
      cy.getByCy("records-export-button").click();
      cy.getByCy("download-button").click();
      cy.wait("@jsonExport").then(({ request }) => {
        expect(request.url).to.include("export_json=true");
        expect(request.url).to.include("export_csv=false");
      });
      cy.readFile(path.join(Cypress.config("downloadsFolder"), `${seed.recordGroupName}.zip`), {
        timeout: 10000,
      }).should("exist");

      mockDownload("csvExport");
      cy.getByCy("records-export-button").click();
      cy.contains('[data-cy="export-type-option"]', "json").click();
      cy.contains('[data-cy="export-type-option"]', "csv").click();
      cy.getByCy("download-button").click();
      cy.wait("@csvExport").then(({ request }) => {
        expect(request.url).to.include("export_json=false");
        expect(request.url).to.include("export_csv=true");
      });

      mockDownload("selectedColumnExport");
      cy.getByCy("records-export-button").click();
      cy.getByCy("export-select-all-columns").click({ force: true });
      cy.getByCy("export-column-label")
        .first()
        .invoke("attr", "data-column")
        .then((columnName) => {
          cy.getByCy("export-column-label").first().click();
          cy.getByCy("download-button").click();
          cy.wait("@selectedColumnExport").its("request.body.columns").should("deep.eq", [columnName]);
        });

      cy.visitApp(`/project/${project._id}`);
      cy.contains('[data-cy="record-group-row"]', seed.recordGroupName)
        .find('[data-cy="record-group-select"]')
        .click();
      cy.intercept("GET", `${Cypress.env("backendURL")}/get_column_data/documentType/**`, {
        statusCode: 200,
        body: {
          columns: ["Oil"],
          obj: {
            name: seed.projectName,
            settings: {},
          },
        },
      }).as("selectedRecordGroupsColumns");
      mockDownload("selectedRecordGroupsExport");
      cy.getByCy("record-groups-export-button").click();
      cy.wait("@selectedRecordGroupsColumns").its("response.statusCode").should("eq", 200);
      cy.getByCy("download-button").click();
      cy.wait("@selectedRecordGroupsExport").then(({ request }) => {
        expect(request.body.document_types).to.be.an("array");
        expect(request.url).to.include("download_records/documentType");
      });
    });
  });
});
