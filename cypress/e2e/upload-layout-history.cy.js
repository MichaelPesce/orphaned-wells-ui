// Controlled API responses exercise layout and navigation without cloud processing.
const group = "aaaaaaaaaaaaaaaaaaaaaaaa";
const job = (id, status = "completed") => ({job_id: id, status, created_at: 100, request_user: {email: "uploader@example.com"}, input: {upload_session_id: id, bucket_name: "test-bucket", prefix: "directory/"}, file_count: 1, summary: {total_succeeded: status === "completed" ? 1 : 0, total_failed: status === "error" ? 1 : 0, total_skipped_duplicates: 0}});
const setup = () => {
  cy.intercept("POST", "**/check_auth", {body: {user_data: {email: "uploader@example.com", name: "Test uploader", permissions: ["upload_document"], default_team: "default", collaborator: "isgs"}, environment: "test"}});
  cy.intercept("GET", "**/fetch_teams", {body: []});
  cy.intercept("GET", `**/get_record_group/${group}`, {body: {rg_data: {_id: group, name: "Upload layout test", processorId: "processor", attributes: []}, project: {_id: "project", name: "Test project"}}});
  cy.intercept("POST", "**/get_records/**", {body: {records: [], record_count: 0, has_active_processing_jobs: false}});
  cy.intercept("GET", "**/check_processor_status/**", {body: 1});
  cy.intercept("POST", "**/check_if_records_exist/**", {body: []});
  cy.intercept("GET", "**/directory_uploads/*/config", {delay: 1000, body: {mode: "direct", max_files: 1000, max_file_bytes: 10000, max_total_bytes: 10000000}}).as("configuration");
};
const open = () => {
  cy.visit(`/record_group/${group}`);
  cy.getByCy("subheader-primary-action").click();
  cy.contains("button", "Local directory").should("be.enabled");
};
const selectFiles = () => cy.getByCy("local-directory-input").then(($input) => {
  const win = $input[0].ownerDocument.defaultView;
  const transfer = new win.DataTransfer();
  for (let index = 0; index < 500; index++) {
    const file = new win.File(["pdf"], `well-${index}.pdf`, {type: "application/pdf"});
    Object.defineProperty(file, "webkitRelativePath", {value: `directory/well-${index}.pdf`});
    transfer.items.add(file);
  }
  $input[0].files = transfer.files;
  $input[0].dispatchEvent(new win.Event("change", {bubbles: true}));
});

describe("upload dialog layout and history", () => {
  beforeEach(() => {cy.clearLocalStorage(); setup();});
  it("keeps desktop geometry stable for slow configuration and 1/10/500 files", () => {
    cy.viewport(1280, 1000);
    open();
    cy.contains("a", "Upload history").should("be.visible");
    cy.screenshot("upload-dialog-file", {capture: "viewport"});
    cy.contains("button", "Processor deployed").click();
    cy.contains('[role="menuitem"]', "Undeploy processor").should("be.visible").type("{esc}");
    selectFiles();
    let top, height, footer, previewHeight;
    cy.getByCy("directory-file-list").then(($preview) => {previewHeight = $preview[0].getBoundingClientRect().height; expect(previewHeight).to.be.within(120, 240);});
    cy.get('[role="dialog"]').then(($dialog) => {const rect = $dialog[0].getBoundingClientRect(); top = rect.top; height = rect.height;});
    cy.getByCy("upload-status-region").then(($status) => {footer = $status[0].getBoundingClientRect().top;});
    cy.wait("@configuration");
    [1, 10, 500].forEach((count) => {
      cy.getByCy("directory-upload-amount-input").find("input").clear().type(String(count));
      cy.getByCy("directory-upload-amount-input").find("input").should("have.value", String(count));
      cy.getByCy("directory-upload-button").should("be.enabled");
      cy.getByCy("directory-file-list").should(($preview) => expect($preview[0].getBoundingClientRect().height).to.eq(previewHeight));
      cy.get('[role="dialog"]').should(($dialog) => {const rect = $dialog[0].getBoundingClientRect(); expect(rect.top).to.eq(top); expect(rect.height).to.eq(height);});
      cy.getByCy("upload-status-region").should(($status) => expect($status[0].getBoundingClientRect().top).to.eq(footer));
    });
    cy.contains("Recent processing jobs").should("not.exist");
    cy.getByCy("directory-prevent-duplicates-toggle").should("be.visible");
    cy.getByCy("directory-run-cleaning-toggle").should("be.visible");
    cy.screenshot("upload-dialog-desktop", {capture: "viewport"});
  });
  it("keeps mobile actions visible and blocks closing during submission", () => {
    cy.viewport(390, 844);
    cy.intercept("POST", `**/batch_process_documents/${group}`, {delay: 1500, body: {job_id: "submitted", status: "queued"}}).as("submit");
    cy.intercept("GET", `**/processing_jobs/${group}/submitted?*`, {body: {job: job("submitted", "queued"), files: [], file_count: 0, retry: {allowed: false}}});
    open();
    cy.getByCy("gcs-directory-button").click();
    cy.getByCy("gcs-bucket-input").find("input").type("test-bucket");
    cy.getByCy("gcs-start-batch-button").should("be.visible").click();
    cy.get('[aria-label="Close upload dialog"]').should("be.disabled");
    cy.wait("@submit");
    cy.contains("button", "Close").should("be.visible");
    cy.get('[role="dialog"]').should(($dialog) => {const rect = $dialog[0].getBoundingClientRect(); expect(rect.width).to.eq(390); expect(rect.bottom).to.be.at.most(844);});
    cy.screenshot("upload-dialog-mobile", {capture: "viewport"});
  });
  it("keeps an older active job visible while paging finished uploads and explains expired retry", () => {
    cy.viewport(1280, 1000);
    cy.intercept("POST", `**/processing_jobs/${group}/history`, (request) => request.reply({body: {active_jobs: [job("older-active", "running")], active_count: 1, jobs: [job(request.body.page ? "second-page" : "first-page", "error")], count: 26}}));
    cy.intercept("GET", `**/processing_jobs/${group}/second-page?*`, {body: {job: job("second-page", "error"), files: [{name: "well.pdf", record_id: "record"}], file_count: 1, retry: {allowed: false, reason: "The upload has expired."}}});
    cy.visit(`/record_group/${group}/uploads`);
    cy.get('[aria-label="View upload older-active"]').should("exist");
    cy.get('[aria-label="Go to next page"]').last().click();
    cy.get('[aria-label="View upload second-page"]').click();
    cy.contains("The upload has expired.").should("be.visible");
    cy.contains("button", "Retry failed processing").should("be.disabled");
    cy.contains("a", "well.pdf").should("have.attr", "href", "/record/record");
    cy.screenshot("upload-history-details", {capture: "viewport"});
  });
});
