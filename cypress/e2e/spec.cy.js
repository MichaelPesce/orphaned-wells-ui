describe('End to end testing', () => {
  beforeEach(() => {
    cy.loginByGoogleApi()
  })

  it('tests that each page loads correctly', () => {
    cy.visit('/');
    cy.wait(1000);
    cy.screenshot('loaded homepage')
    
    // test that correct user is logged in
    // cy.findByRole('button', {
    //   name: /michael p/i
    // }).should('be.visible')

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
      name: /test project 1/i
    }).click()

    // test that project page loaded correctly
    cy.findByRole('button', {
      name: /test project 1/i
    }).should('be.visible')
    cy.findByRole('columnheader', {
      name: /record name/i
    }).should('be.visible')

    cy.screenshot('project page')

    // click record
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
    cy.enter_text('id', 'project-name-textbox', 'test project')

    // click first processor available
    cy.get('#processor_0').click()
    cy.screenshot('entered project name and selected processor')

    // click create project button and wait for API response
    cy.intercept({
      method: 'POST',
      url: Cypress.env('backendURL')+'/**',
    }).as('createProject');

    cy.findByRole('button', {
      name: /create project/i
    }).click();

    cy.wait('@createProject', {timeout: 10000});

    // click first processor available
    cy.get('#testproject_project_row').should('be.visible')
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
      cy.get('#testproject_project_row').click();
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

  it('tests edit field, review status change', () => {
    // click on record
    cy.visit('/#/record/665dc43463bca3e588d279b9');
    cy.wait(2000)
    cy.screenshot('navigated to record bulk3')

    // click on field FIELD_NAME
    cy.get('#FIELD_NAME_confidence').contains('%')
    cy.findByRole('cell', {
      name: /field_name/i
    }).click()
    cy.screenshot('clicked on field_name')

    // click on edit icon
    cy.get('#edit-field-icon').click()
    cy.screenshot('clicked edit icon')

    // enter text
    cy.enter_text('id', 'edit-field-text-box', 'edited{enter}')
    cy.wait(1000)
    cy.screenshot('entered text and hit enter')

    // verify that field now shows edited
    cy.get('#FIELD_NAME_confidence').contains(/edited/i)
    cy.screenshot('edited field')

    // verifew review status is incomplete
    cy.reload()
    cy.get('#review_status_chip').contains('incomplete')
    cy.screenshot('review status is incomplete')

    // mark as unreviewed
    cy.findByRole('button', {
      name: /mark as unreviewed/i
    }).click()
    cy.wait(1000)
    cy.get('.popup-primary-button').click()
    cy.wait(1000)

    // verify review status is unreviewed
    cy.get('#review_status_chip').contains('unreviewed')
    cy.screenshot('review status is unreviewed')

  })

  it('mark record as unreviewed', () => {
    
  })

  it('tests export data', () => {
    
  })

})