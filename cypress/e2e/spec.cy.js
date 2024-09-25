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
    cy.get('#testproject_table_row').should('be.visible')
    cy.screenshot('end test create new project')


  })

  it('tests delete project', () => {
    
  })

  it('tests export data', () => {
    
  })

  it('tests edit field', () => {
    
  })

})