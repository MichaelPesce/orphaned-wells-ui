const expectedNoteCreator = () => {
  const authMode = String(Cypress.env("authMode") || "mock").toLowerCase();
  if (["disabled", "mock", "stub", "stubbed"].includes(authMode)) return "anonymous";
  return undefined;
};

const logInterception = (label, interception) => {
  const { request, response, error } = interception;
  const recordData = response?.body?.recordData;
  const summary = {
    method: request?.method,
    url: request?.url,
    requestBody: request?.body,
    statusCode: response?.statusCode,
    recordData: recordData ? {
      _id: recordData._id,
      name: recordData.name,
      record_group_id: recordData.record_group_id,
      review_status: recordData.review_status,
      previous_id: recordData.previous_id,
      next_id: recordData.next_id,
    } : response?.body,
    error: error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : undefined,
  };

  cy.task("log", `${label}:\n${JSON.stringify(summary, null, 2)}`);
};

const waitForRecordFetch = (alias, expectedName) => {
  return cy.wait(alias, { timeout: 30000 }).then((interception) => {
    logInterception("record-notes get_record", interception);
    expect(interception.error, `get_record network error for ${interception.request.url}`).to.not.exist;
    expect(interception.response?.statusCode).to.be.oneOf([200, 303]);
    expect(interception.response?.body?.recordData?.name).to.eq(expectedName);
  });
};

const visitRecordPage = (record, expectedName, alias = "loadRecord") => {
  cy.intercept("POST", `${Cypress.env("backendURL")}/get_record/${record._id}`).as(alias);
  cy.visitApp(`/record/${record._id}`);
  waitForRecordFetch(`@${alias}`, expectedName);
  cy.findByRole("columnheader", { name: /field/i, timeout: 30000 }).should("be.visible");
};

const expectEditableNoteFromApi = (recordId, noteText) => {
  cy.api("GET", `/get_record_notes/${recordId}`).then(({ body }) => {
    const note = body.find((candidate) => candidate.text === noteText && !candidate.deleted);
    const noteSummary = note ? {
      text: note.text,
      creator: note.creator,
      resolved: note.resolved,
      deleted: note.deleted,
      isReply: note.isReply,
    } : null;

    cy.task("log", `record-notes API note metadata:\n${JSON.stringify(noteSummary, null, 2)}`);
    expect(note, `note '${noteText}' returned by get_record_notes`).to.exist;

    const creator = expectedNoteCreator();
    if (creator) {
      expect(note.creator, `creator for note '${noteText}'`).to.eq(creator);
    }
  });
};

describe("record notes", () => {
  beforeEach(() => {
    cy.resetSeedData();
    cy.clearLocalStorage();
  });

  it("adds, edits, replies, resolves, reopens, deletes, and reflects notes in the table", () => {
    const noteText = `Cypress note ${Date.now()}`;
    const editedNoteText = `${noteText} edited`;
    const replyText = `${noteText} reply`;

    cy.findSeededEntities().then(({ seed, recordGroup, record }) => {
      visitRecordPage(record, seed.recordName, "loadInitialRecord");

      cy.getByCy("record-notes-open-button").click();
      cy.getByCy("record-notes-dialog").should("be.visible");
      cy.getByCy("new-note-input").find("textarea").first().type(noteText);
      cy.intercept("POST", `${Cypress.env("backendURL")}/update_record/**`).as("updateNotes");
      cy.getByCy("add-note-button").click();
      cy.wait("@updateNotes").its("response.statusCode").should("eq", 200);
      cy.contains('[data-cy="record-note"]', noteText).should("be.visible");
      expectEditableNoteFromApi(record._id, noteText);

      cy.findByLabelText(/close/i).click();
      cy.intercept("POST", `${Cypress.env("backendURL")}/get_records/record_group*`).as("loadRecordGroupRecords");
      cy.visitApp(`/record_group/${recordGroup._id}`);
      cy.wait("@loadRecordGroupRecords", { timeout: 30000 }).then(({ request, response }) => {
        expect(request.body.id).to.eq(recordGroup._id);
        expect(response?.statusCode).to.eq(200);
        expect(response?.body.records.map((record) => record.name)).to.include(seed.recordName);
      });
      cy.contains('[data-cy="record-row"]', seed.recordName, { timeout: 30000 })
        .find('[data-cy="record-notes-button"]')
        .should("have.attr", "data-has-notes", "true");

      visitRecordPage(record, seed.recordName, "loadRecordForEdit");
      cy.getByCy("record-notes-open-button").click();
      cy.contains('[data-cy="record-note"]', noteText).should("be.visible");
      expectEditableNoteFromApi(record._id, noteText);

      cy.contains('[data-cy="record-note"]', noteText).within(() => {
        cy.getByCy("edit-note-button").click();
        cy.getByCy("edit-note-input").find("textarea").first().clear().type(editedNoteText);
        cy.getByCy("edit-note-button").click();
      });
      cy.wait("@updateNotes").its("response.statusCode").should("eq", 200);
      cy.contains('[data-cy="record-note"]', editedNoteText).should("be.visible");

      cy.contains('[data-cy="record-note"]', editedNoteText).within(() => {
        cy.getByCy("reply-note-button").click({ force: true });
        cy.getByCy("reply-note-input").type(replyText);
        cy.getByCy("submit-reply-button").click();
      });
      cy.wait("@updateNotes").its("response.statusCode").should("eq", 200);
      cy.contains('[data-cy="record-note"]', replyText).should("be.visible");

      cy.contains('[data-cy="record-note"]', editedNoteText).within(() => {
        cy.getByCy("resolve-note-button").click();
      });
      cy.wait("@updateNotes").its("response.statusCode").should("eq", 200);
      cy.contains("Resolved comments").should("be.visible");
      cy.getByCy("show-resolved-comments").click();
      cy.getByCy("reopen-note-button").click();
      cy.wait("@updateNotes").its("response.statusCode").should("eq", 200);

      cy.contains('[data-cy="record-note"]', editedNoteText).within(() => {
        cy.getByCy("delete-note-button").click();
      });
      cy.getByCy("popup-primary-button").click();
      cy.wait("@updateNotes").its("response.statusCode").should("eq", 200);
      cy.contains('[data-cy="record-note"]', editedNoteText).should("not.exist");

      cy.findByLabelText(/close/i).click();
    });
  });
});
