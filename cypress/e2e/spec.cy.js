const path = require("path");
const test_record_group_name = "Illinois Test Project"
const test_project_name = "ISGS Project"
describe('End to end testing', () => {
  beforeEach(() => {
    cy.loginByGoogleApi()
  })

  it('tests that each page loads correctly', () => {
    cy.visit('/');
    cy.wait(1000);
    cy.screenshot('loaded homepage')

    // test that privileges are working
    cy.findByRole('button', {
      name: /new project/i
    }).should('be.visible')
    cy.findByRole('tab', {
      name: /users/i
    }).should('be.visible')

    cy.screenshot('homepage')

    // navigate to project page
    cy.findByRole('rowheader', {
      name: test_project_name
    }).click()

    cy.wait(5000)

    // test that project page loaded correctly
    cy.findByRole('button', {
      name: test_project_name
    }).should('be.visible')
    cy.findByRole('columnheader', {
      name: /record group name/i
    }).should('be.visible')

    cy.screenshot('project page')

    // click first record group
    cy.findByRole('rowheader', {
      name: test_record_group_name
    }).click()

    // test that record group page loaded correctly
    cy.findByRole('button', {
      name: test_record_group_name
    }).should('be.visible')
    cy.findByRole('columnheader', {
      name: /record name/i
    }).should('be.visible')
    cy.screenshot('record group page')

    // click first record
    cy.get('.MuiTableRow-root').eq(1).click();
    
    // test that record page loaded correctly
    cy.findByRole('columnheader', {
      name: /field/i
    }).should('be.visible')

    cy.screenshot('record page')
  })

  it('tests create new project', () => {
    // load homepage
    cy.visit('/');
    cy.wait(1000);
    cy.screenshot('loaded homepage')

    // click new project button
    cy.findByRole('button', {
      name: /new project/i
    }).click()
    cy.wait(1000)
    cy.screenshot('clicked new project')
    
    // enter project name: test project
    cy.enter_text('id', 'project-name-textbox', 'cypress test project')

    // click first processor available
    // cy.get('#processor_0').click()
    // cy.screenshot('entered project name and selected processor')

    // click create project button and wait for API response
    cy.intercept({
      method: 'POST',
      url: Cypress.env('backendURL')+'/**',
    }).as('createProject');

    cy.findByRole('button', {
      name: /create project/i
    }).click();

    cy.wait('@createProject', {timeout: 10000});

    // test that project page created correctly
    cy.findByRole('button', {
      name: 'cypress test project'
    }).should('be.visible')
    cy.findByRole('columnheader', {
      name: /record group name/i
    }).should('be.visible')

    cy.screenshot('end test create new project')

  })

  it('tests delete project', () => {
    // load homepage
    cy.visit('/');
    cy.wait(1000);
    cy.screenshot('loaded homepage')

    // get starting length of projects table and work from there
    cy.get('.project_row').its('length').then((project_amt) => {

      cy.log("project_amt: ")
      cy.log(project_amt)

      // click on last created project (should be named test project)
      cy.get('#cypresstestproject_project_row').click();
      cy.wait(2000)
      cy.screenshot('navigated to project')

      // click dropdown and select delete project
      cy.get('#options-button').click();
      cy.wait(1000)
      cy.screenshot('clicked dropdown')
      cy.findByRole('menuitem', {
        name: /delete project/i
      }).click()
      cy.wait(1000)
      cy.screenshot('clicked delete')
      
      // click confirmation delete button
      cy.findByRole('button', {
        name: /delete/i
      }).click()
      // cy.get('.popup-primary-button').click()
      cy.wait(3000)

      // confirm that we are back on homepage and that there is 1 less project
      cy.findByRole('button', {
        name: /new project/i
      }).should('be.visible')
      cy.get('.project_row').should('have.length', project_amt - 1)
      cy.screenshot('end test delete project')
      
   });
  })

  it('tests edit field, review status updates, mark as unreviewed', () => {
    // click on record
    cy.visit('/record/665647e58294448787521760');
    cy.wait(2000)
    cy.screenshot('navigated to record cypress test record')

    // make table full screen
    cy.get('#fullscreen-table-button').click()

    // click on field
    let field_name = "ACIDIZED"
    cy.get('#'+field_name+'_confidence').contains(/not found/i)
    cy.findByText(field_name).click()
    cy.screenshot('clicked on '+field_name)

    // click on edit icon
    cy.get('#edit-field-icon').click()
    cy.screenshot('clicked edit icon')

    // enter text
    cy.enter_text('id', 'edit-field-text-box', 'edited{enter}')
    cy.wait(1000)
    cy.screenshot('entered text and hit enter')

    // verify that field now shows edited
    cy.get('#'+field_name+'_confidence').contains(/edited/i)
    cy.screenshot('edited field')

    // verifew review status is incomplete
    cy.reload()
    cy.get('#review_status_chip').contains('incomplete')
    cy.screenshot('review status is incomplete')

    // mark as unreviewed
    cy.findByRole('button', {
      name: /reset to unreviewed/i
    }).click()
    cy.wait(1000)
    cy.get('.popup-primary-button').click()
    cy.wait(1000)

    // verify review status is unreviewed
    cy.wait(5000)
    cy.get('#review_status_chip').contains('unreviewed')
    cy.screenshot('review status is unreviewed')

  })

  it('tests export data', () => {
    cy.visit('/record_group/6656476a448c4d1812645c07');
    cy.wait(1000)
    cy.screenshot('navigated to project test list')

    // click export project
    cy.findByRole('button', {
      name: /export/i
    }).click()
    cy.wait(1000)

    // click export
    cy.get('#download-button').click()

    // verify that file was downloaded
    const downloadsFolder = Cypress.config("downloadsFolder");
    cy.readFile(path.join(downloadsFolder, test_record_group_name+"_records.zip")).should("exist");
  })

})