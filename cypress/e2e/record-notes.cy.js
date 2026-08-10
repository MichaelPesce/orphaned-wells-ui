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
      cy.visitApp(`/record/${record._id}`);
      cy.findByRole("columnheader", { name: /field/i, timeout: 30000 }).should("be.visible");

      cy.getByCy("record-notes-open-button").click();
      cy.getByCy("record-notes-dialog").should("be.visible");
      cy.getByCy("new-note-input").find("textarea").first().type(noteText);
      cy.intercept("POST", `${Cypress.env("backendURL")}/update_record/**`).as("updateNotes");
      cy.getByCy("add-note-button").click();
      cy.wait("@updateNotes").its("response.statusCode").should("eq", 200);
      cy.contains('[data-cy="record-note"]', noteText).should("be.visible");

      cy.findByLabelText(/close/i).click();
      cy.visitApp(`/record_group/${recordGroup._id}`);
      cy.contains('[data-cy="record-row"]', seed.recordName)
        .find('[data-cy="record-notes-button"]')
        .should("have.attr", "data-has-notes", "true");

      cy.visitApp(`/record/${record._id}`);
      cy.findByRole("columnheader", { name: /field/i, timeout: 30000 }).should("be.visible");
      cy.getByCy("record-notes-open-button").click();
      cy.contains('[data-cy="record-note"]', noteText).should("be.visible");

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
