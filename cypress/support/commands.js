/// <reference types="cypress" />
// ***********************************************
// For comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// cypress/support/commands.js
import "@testing-library/cypress/add-commands";

/**
 * Login by Google API using environment variables.
 *
 * Runs before every test.
 */
Cypress.Commands.add("loginByGoogleApi", () => {
  cy.log("Logging in to Google");
  let request_body = {
    grant_type: "refresh_token",
    client_id: Cypress.env("googleClientId"),
    client_secret: Cypress.env("googleClientSecret"),
    refresh_token: Cypress.env("googleRefreshToken"),
  };
  cy.request({
    method: "POST",
    url: "https://www.googleapis.com/oauth2/v4/token",
    body: request_body,
  }).then(({ body }) => {
    const { access_token, id_token } = body;
    window.localStorage.setItem("access_token", access_token);
    window.localStorage.setItem("id_token", id_token);
    cy.request({
      method: "POST",
      url: Cypress.env("backendURL")+"/check_auth",
      body: JSON.stringify(id_token),
      headers: { Authorization: `Bearer ${id_token}` },
    }).then(({ body }) => {

      window.localStorage.setItem("user_email", body.email);
      window.localStorage.setItem("user_hd", body.hd);
      window.localStorage.setItem("role", ""+body.role);
      window.localStorage.setItem("permissions", JSON.stringify(body.permissions));
      window.localStorage.setItem("user_name", body.name);
      window.localStorage.setItem("user_picture", body.picture);
      window.localStorage.setItem("user_info", JSON.stringify(body));
      cy.visit("/");
    });
  });
});


/**
 * Enter text into element based on role and name
 *
 * From page: Inputs
 */
Cypress.Commands.add("enter_text", (identifier, role_or_class, value, name ) => {
  let input_textbox;
  if (identifier === "role") {
    input_textbox = cy.findByRole(role_or_class, {name: name});
  }
  else if (identifier === "class") {
    input_textbox = cy.get("."+role_or_class); 
  }
  else if (identifier === "id") {
    input_textbox = cy.get("#"+role_or_class);
  }
  input_textbox.click({force:true});
  if (identifier === "role") {
    input_textbox = cy.findByRole(role_or_class, {name: name});
    input_textbox.clear().type(value);
  }
  else if (identifier === "class") {
    input_textbox = cy.get("."+role_or_class);
    input_textbox.type("{backspace}{backspace}{backspace}{backspace}" + value);
  }
  else if (identifier === "id") {
    input_textbox = cy.get("#"+role_or_class);
    input_textbox.type("{backspace}{backspace}{backspace}{backspace}" + value);
  }
  cy.wait(500);
});