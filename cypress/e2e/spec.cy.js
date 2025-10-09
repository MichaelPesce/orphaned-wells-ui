const path = require("path");
const test_record_group_name = "Illinois Test Project"
const test_project_name = "ISGS Project"
const test_record_group = {
  id: "6656476a448c4d1812645c07",
  name: "Illinois Test Project",
}
const test_record = {
  id: "665647e58294448787521760",
  name: "120190021400_WELL_COMPLETION_REPORT_1"
}
const next_record = {
  id: "665647e549e025f35668c67d",
  name: "120190139500_WELL_COMPLETION_REPORT_1"
}
const prev_record = {
  id: "665647e45642b536ded828ad",
  name: "120190129000_WELL_COMPLETION_REPORT_1",
}

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
    cy.visit('/record/'+test_record.id);
    cy.wait(2000)
    cy.screenshot('navigated to cypress test record: '+test_record.id)

    // make table full screen
    cy.get('#fullscreen-table-button').click()

    // click on field
    let field_name = "Acidized"
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

  it('tests next, previous records', () => {
    // navigate to record
    cy.visit('/record/'+test_record.id);
    cy.contains('div', test_record.name).should('be.visible', {timeout: 10000})
    cy.screenshot('navigated to cypress test record: '+test_record.id)

    // keyboard shortcut for going to next record
    cy.get('body').type('{ctrl}{rightArrow}')
    cy.contains('div', next_record.name).should('be.visible', {timeout: 10000})
    cy.screenshot('navigated to next record: '+next_record.name)

    // keyboard shortcut for going to previous record
    cy.get('body').type('{ctrl}{leftArrow}')
    cy.contains('div', test_record.name).should('be.visible', {timeout: 10000})
    cy.screenshot('navigated to next record: '+next_record.name)

    cy.get('body').type('{ctrl}{leftArrow}')
    cy.contains('div', prev_record.name).should('be.visible', {timeout: 10000})
    cy.screenshot('navigated to next record: '+prev_record.name)

  })

  it('tests export data', () => {
    cy.visit('/record_group/'+test_record_group.id);
    cy.contains('div', test_record_group.name).should('be.visible', {timeout: 10000})
    cy.screenshot('navigated to record group')

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

    it('tests filtering, sorting', () => {
      cy.visit('/record_group/'+test_record_group.id);
      cy.contains('div', test_record_group.name).should('be.visible', {timeout: 10000})
      cy.screenshot('navigated to record group')

      // Assert that record group has the proper record amount
      cy.get('.record_row').should('have.length', 100)

      // Apply a filter - date selected before June 1, 2024
      cy.contains('button', /filters/i).click()
      cy.contains('button', /new filter/i).click()
      cy.get('#column-select').click()
      cy.contains('li', "Date Uploaded").click()
      cy.get('#operator-select').click()
      cy.contains('li', "Is Before").click()
      cy.get('.date-filter-input').type('2024-06-01', {force: true})
      cy.contains('button', /apply filters/i).click({force: true})

      // Assert that we now have 20 records
      cy.get('.record_row').should('have.length', 20, { timeout: 10000 })

      // Test sorting. 
      // Assert we have the right element in the 20th row
      const record_number_20 = "120190132100_WELL_COMPLETION_REPORT_1"
      const record_number_19 = "120190131200_WELL_COMPLETION_REPORT_1"
      cy.get('.record_row').eq(19).should('contain', record_number_20)
      cy.contains('p', /date uploaded/i).click()

      // Assert that the 20th element is now first
      cy.get('.record_row').eq(0).should('contain', record_number_20, { timeout: 10000 })

      // Navigate to record
      cy.get('.record_row').eq(0).click()

      // Assert that we have the right record name and index
      cy.contains('div', `1. ${record_number_20}`, { timeout: 20000 })

      // Navigate to next record
      cy.contains('button', /next/i).click()

      // Assert that we have the right record name and index
      cy.contains('div', `2. ${record_number_19}`, { timeout: 20000 })
      
      // Go back to record page
      cy.contains('button', test_record_group.name).click()
      cy.contains('div', test_record_group.name).should('be.visible', {timeout: 10000})

      // Reverse date sort
      cy.contains('p', /date uploaded/i).click()

      // Clear filters
      cy.contains('button', /filters/i).click()
      cy.contains('button', /reset filters/i).click()

      // Assert that we have 100 records in the table again
      cy.get('.record_row').should('have.length', 100, { timeout: 10000 })
      
  })

})