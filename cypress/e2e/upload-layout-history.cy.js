// Controlled API responses exercise layout and navigation without cloud processing.
const group = "aaaaaaaaaaaaaaaaaaaaaaaa";
const project = "bbbbbbbbbbbbbbbbbbbbbbbb";
const otherGroup = "cccccccccccccccccccccccc";
const otherProject = "dddddddddddddddddddddddd";
const scopes = [
  {id: project, name: "Illinois records", record_groups: [{id: group, name: "Well completion reports"}]},
  {id: otherProject, name: "Historic surveys", record_groups: [{id: otherGroup, name: "Field reports"}]},
];
const job = (id, status = "completed") => ({job_id: id, record_group_id: group, project_id: project, project_name: "Illinois records", record_group_name: "Well completion reports", status, created_at: 1789380600, completed_at: status === "completed" ? 1789380900 : undefined, request_user: {email: "uploader@example.com"}, input: {upload_session_id: id, bucket_name: "test-bucket", prefix: "directory/"}, file_count: 1, summary: {total_succeeded: status === "completed" ? 1 : 0, total_failed: status === "error" ? 1 : 0, total_skipped_duplicates: 0}});
const setup = () => {
  cy.intercept("POST", "**/check_auth", {body: {user_data: {email: "uploader@example.com", name: "Test uploader", permissions: ["manage_team", "upload_document"], default_team: "default", collaborator: "isgs"}, environment: "test"}});
  cy.intercept("GET", "**/fetch_teams", {body: []});
  cy.intercept("GET", "**/processing_jobs/scopes", {body: scopes});
  cy.intercept("GET", `**/get_record_group/${group}`, {body: {rg_data: {_id: group, name: "Upload layout test", processorId: "processor", has_schema: true, can_process: true}, project: {_id: "project", name: "Test project"}}});
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
  it("recovers unavailable status and shows deployment through stale status responses", () => {
    let available = false, requested = false, checksAfterDeploy = 0;
    cy.intercept("GET", "**/check_processor_status/**", (request) => {
      const state = !available ? 10 : !requested ? 3 : [3, 2, 1][Math.min(checksAfterDeploy++, 2)];
      request.reply({body: state});
    }).as("processorStatus");
    cy.intercept("POST", `**/deploy_processor/${group}`, (request) => {
      requested = true;
      request.reply({delay: 800, body: 2});
    }).as("deployProcessor");
    cy.visit(`/record_group/${group}`);
    cy.getByCy("subheader-primary-action").click();
    cy.wait("@processorStatus");
    cy.contains("button", "Processor unavailable").should("be.enabled").click();
    cy.contains("Processor not found or its status is unavailable.").should("be.visible").then(() => {available = true;});
    cy.contains('[role="menuitem"]', "Retry status check").click();
    cy.wait("@processorStatus");
    cy.contains("button", "Processor undeployed").click();
    cy.contains('[role="menuitem"]', "Deploy processor").click();
    cy.contains("button", "Processor deploying").should("be.visible").and("be.disabled");
    cy.wait("@deployProcessor");
    [3, 2].forEach((state) => {
      cy.wait("@processorStatus", {requestTimeout: 10000}).its("response.body").should("eq", state);
      cy.contains("button", "Processor deploying").should("be.disabled");
      cy.contains('[role="menuitem"]', "Deploy processor").should("not.exist");
    });
    cy.wait("@processorStatus", {requestTimeout: 10000}).its("response.body").should("eq", 1);
    cy.contains("button", "Processor deployed").should("be.enabled");
    cy.getByCy("local-directory-button").should("be.enabled");
    cy.get("@deployProcessor.all").should("have.length", 1);
  });
  it("keeps desktop geometry stable for slow configuration and 1/10/500 files", () => {
    cy.viewport(1280, 1000);
    open();
    cy.contains("a", "Upload history").should("be.visible").and("have.attr", "href", "/admin?tab=uploads");
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
    cy.intercept("POST", `**/batch_process_documents/${group}/check_gcs_path`, {body: {totalFiles: 1, totalFilesToSubmit: 1, totalBatches: 1, totalBatchesToSubmit: 1, duplicateCount: 0}}).as("checkPath");
    cy.intercept("POST", `**/batch_process_documents/${group}`, {delay: 1500, body: {job_id: "submitted", status: "queued"}}).as("submit");
    cy.intercept("GET", `**/processing_jobs/${group}/submitted?*`, {body: {job: job("submitted", "queued"), files: [], file_count: 0, retry: {allowed: false}}});
    open();
    cy.getByCy("gcs-directory-button").click();
    cy.getByCy("gcs-bucket-input").find("input").type("test-bucket");
    cy.getByCy("gcs-start-batch-button").should("be.visible").and("be.disabled");
    cy.getByCy("gcs-check-path-button").click();
    cy.wait("@checkPath");
    cy.getByCy("gcs-start-batch-button").should("be.enabled").click();
    cy.get('[aria-label="Close upload dialog"]').should("be.disabled");
    cy.wait("@submit");
    cy.contains("button", "Close").should("be.visible");
    cy.get('[role="dialog"]').should(($dialog) => {const rect = $dialog[0].getBoundingClientRect(); expect(rect.width).to.eq(390); expect(rect.bottom).to.be.at.most(844);});
    cy.screenshot("upload-dialog-mobile", {capture: "viewport"});
  });
  it("keeps an older active job visible while paging finished uploads and explains expired retry", () => {
    cy.viewport(1280, 1000);
    cy.intercept("POST", "**/processing_jobs/history", (request) => request.reply({body: {active_jobs: [job("older-active", "running")], active_count: 1, jobs: [job(request.body.page ? "second-page" : "first-page", "error")], count: 26}}));
    cy.intercept("GET", `**/processing_jobs/${group}/second-page?*`, {body: {job: job("second-page", "error"), files: [{name: "well.pdf", record_id: "record"}], file_count: 1, retry: {allowed: false, reason: "The upload has expired."}}});
    cy.visit(`/record_group/${group}/uploads`);
    cy.location("pathname").should("eq", "/admin");
    cy.location("search").should("include", `tab=uploads&record_group=${group}`);
    cy.getByCy("admin-roles-section").should("not.exist");
    cy.get('[aria-label="View upload older-active"]').should("exist");
    cy.get('[aria-label="Go to next page"]').last().click();
    cy.get('[aria-label="View upload second-page"]').click();
    cy.contains("The upload has expired.").should("be.visible");
    cy.contains("button", "Retry failed processing").should("be.disabled");
    cy.contains("a", "well.pdf").should("have.attr", "href", "/record/record");
    cy.location("search").should("include", "job=second-page");
    cy.reload();
    cy.contains("The upload has expired.").should("be.visible");
    cy.screenshot("upload-history-details", {capture: "viewport"});
    cy.contains("button", "Close").click();
    cy.location("search").should("include", `record_group=${group}`).and("not.include", "job=");
  });
  it("filters both lists by project and group and preserves navigation through Admin tabs", () => {
    cy.viewport(1280, 1000);
    cy.intercept("POST", "**/check_auth", {body: {user_data: {email: "uploader@example.com", permissions: ["manage_team", "system_administration", "upload_document"], default_team: "default"}, environment: "test"}});
    cy.intercept("GET", "**/get_users", {body: []}).as("users");
    cy.intercept("POST", "**/fetch_roles", {body: []});
    cy.intercept("POST", "**/fetch_permission_catalog", {body: []});
    cy.intercept("GET", `**/processing_jobs/${otherGroup}/other?*`, {body: {job: {...job("other"), record_group_id: otherGroup}, files: [], file_count: 0, retry: {allowed: false}}}).as("otherDetails");
    cy.intercept("POST", "**/processing_jobs/history", (request) => {
      const all = !request.body.project_id && !request.body.record_group_id;
      request.reply({body: {active_jobs: [job("processing", "running")], active_count: 1, jobs: [job("complete"), ...(all ? [{...job("other", "completed_with_errors"), record_group_id: otherGroup, project_id: otherProject, project_name: "Historic surveys", record_group_name: "Field reports", summary: {total_succeeded: 18, total_failed: 2, total_skipped_duplicates: 0}, file_count: 20, input: {bucket_name: "test-bucket", prefix: "batch/"}}] : [])], count: all ? 2 : 1}});
    }).as("history");
    cy.visit("/admin?tab=uploads");
    cy.wait("@history").its("request.body").should("not.have.property", "project_id");
    cy.getByCy("admin-uploads-section").should("have.attr", "aria-selected", "true");
    cy.get("@users.all").should("have.length", 0);
    cy.contains("a", "Field reports").should("be.visible");
    cy.screenshot("admin-upload-history", {capture: "fullPage"});
    cy.get('[aria-label="View upload other"]').click();
    cy.wait("@otherDetails");
    cy.location("search").should("include", `job_group=${otherGroup}`);
    cy.get('[role="dialog"]').contains("Historic surveys").should("be.visible");
    cy.contains("button", "Close").click();
    cy.location("search").should("eq", "?tab=uploads");
    cy.findByRole("combobox", {name: "Project"}).click();
    cy.findByRole("option", {name: "Illinois records"}).click();
    cy.wait("@history").its("request.body").should("include", {project_id: project, page: 0, active_page: 0});
    cy.findByRole("combobox", {name: "Record group"}).click();
    cy.findByRole("option", {name: "Well completion reports"}).click();
    cy.wait("@history").its("request.body").should("include", {project_id: project, record_group_id: group});
    cy.findByRole("textbox", {name: "Uploader"}).type("uploader@");
    cy.contains("button", "Apply filters").click();
    cy.wait("@history").its("request.body.filter").should("deep.equal", {"request_user.email": {$regex: "uploader@"}});
    cy.get('[aria-label="View upload processing"]').should("exist");
    cy.getByCy("admin-roles-section").click();
    cy.location("search").should("eq", "?tab=roles");
    cy.getByCy("admin-users-section").click();
    cy.location("search").should("eq", "");
    cy.wait("@users");
    cy.go("back");
    cy.getByCy("admin-roles-section").should("have.attr", "aria-selected", "true");
    cy.go("back");
    cy.getByCy("admin-uploads-section").should("have.attr", "aria-selected", "true");
    cy.findByRole("combobox", {name: "Record group"}).should("have.value", "Well completion reports");
    cy.reload();
    cy.findByRole("combobox", {name: "Project"}).should("have.value", "Illinois records");
    cy.viewport(390, 844);
    cy.findByRole("combobox", {name: "Record group"}).should("be.visible");
    cy.getByCy("admin-uploads-section").should(($tab) => {
      const bounds = $tab[0].getBoundingClientRect();
      expect(bounds.left).to.be.at.least(0);
      expect(bounds.right).to.be.at.most(390);
    });
    cy.get('[role="tabpanel"]').should(($panel) => expect($panel[0].getBoundingClientRect().right).to.be.at.most(390));
    cy.screenshot("admin-upload-history-mobile", {capture: "fullPage"});
  });
  it("keeps upload history accessible after a Users API error and reports history errors with retry", () => {
    cy.intercept("GET", "**/get_users", {statusCode: 503, body: {detail: "Users temporarily unavailable"}});
    let failed = true;
    cy.intercept("POST", "**/processing_jobs/history", (request) => request.reply(failed ? {statusCode: 503, body: {detail: "History temporarily unavailable"}} : {body: {active_jobs: [], active_count: 0, jobs: [], count: 0}}));
    cy.visit("/admin");
    cy.getByCy("admin-users-section").should("have.attr", "aria-selected", "true");
    cy.contains("Unable to load users.").should("be.visible");
    cy.getByCy("admin-uploads-section").click();
    cy.contains("History temporarily unavailable").should("be.visible").then(() => {failed = false;});
    cy.contains("button", "Retry").click();
    cy.contains("No active uploads in this selection.").should("be.visible");
    cy.contains("History temporarily unavailable").should("not.exist");
  });
});
