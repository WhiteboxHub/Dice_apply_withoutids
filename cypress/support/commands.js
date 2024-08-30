// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
Cypress.Commands.add('loginDice', () => {
  // Access credentials from Cypress environment
  const credentials = Cypress.env('credentials');
  const userKey = Cypress.env('defaultUserKey');
  const user = credentials[userKey];

  if (!user) {
    throw new Error(`No credentials found for user key: ${userKey}`);
  }

  const { username, password, apply } = user;

  if (apply !== 's') {
    // If apply is not 's', skip the application process
    cy.log(`Skipping application for ${userKey}`);
    return;
  }

  // Increase pageLoadTimeout for this specific visit
  cy.visit('https://www.dice.com/dashboard/login');

  // Type username and password, then click submit button
  cy.get('input[placeholder="Please enter your email"][type="email"][name="email"]').type(username);
  cy.get('button[data-testid="sign-in-button"]').click().wait(2000);
  cy.get('input[placeholder="Enter Password"]').type(password);
  cy.get('button[data-testid="submit-password"]').click();
  cy.wait(5000);

  // Optionally, add assertions or further actions after login
});


const path = require('path');
Cypress.Commands.add('applyForJob', ({ jobId, timestamp }) => {
    cy.visit(`https://www.dice.com/job-detail/${jobId}`, { failOnStatusCode: false, timeout: 35000 })
        .then(() => {
            cy.get('body').then($body => {
                if ($body.text().includes('Sorry this job is no longer available.')) {
                    cy.task('logApplicationInfo', `${timestamp} - Sorry, this job is no longer available for job ID: ${jobId}`);
                    cy.task('writeCSV', {
                        filePath: 'cypress/fixtures/applied/job_applications.csv',
                        data: { jobId, timestamp, status: 'no longer available' },
                        headers: ['jobId', 'timestamp', 'status'],
                        append: true
                    });
                    cy.task('updateStatusSummary', 'noLonger');
                } else {
                    cy.wait(20000);
                    cy.get('.hydrated', { timeout: 15000 }).shadow().find('p').then($p => {
                        const buttonText = $p.text().trim();
                        if (buttonText.includes('Application Submitted')) {
                            cy.task('logApplicationInfo', `${timestamp} - Application already submitted for job ID: ${jobId}`);
                            cy.task('writeCSV', {
                                filePath: 'cypress/fixtures/applied/job_applications.csv',
                                data: { jobId, timestamp, status: 'already applied' },
                                headers: ['jobId', 'timestamp', 'status'],
                                append: true
                            });
                            cy.task('updateStatusSummary', 'alreadyApplied');
                        } else {
                            cy.wait(15000);
                            cy.get('.hydrated').shadow().find('button').then($button => {
                                const buttonText = $button.text().trim();
                                if (buttonText.includes('Easy apply')) {
                                    cy.task('logApplicationInfo', `${timestamp} - Easy apply button found for job ID: ${jobId}`);
                                    cy.get('#applyButton > .hydrated').click({ timeout: 5000 });
                                    cy.contains('span[data-v-5a80815f]', 'Next', { timeout: 3000 }).click();
                                    
                                    cy.get('span[data-v-5a80815f]', { timeout: 5000 }).then($submitButton => {
                                        if ($submitButton.text().trim().includes('Submit')) {
                                            cy.wrap($submitButton).click();
                                            cy.task('logApplicationInfo', `${timestamp} - Job with ID ${jobId} applied successfully.`);
                                            cy.task('writeCSV', {
                                                filePath: 'cypress/fixtures/applied/job_applications.csv',
                                                data: { jobId, timestamp, status: 'applied' },
                                                headers: ['jobId', 'timestamp', 'status'],
                                                append: true
                                            });
                                            cy.task('updateStatusSummary', 'applied');
                                        } else {
                                            cy.task('logApplicationInfo', `${timestamp} - Submit button not found for job ID: ${jobId}. Skipping to next job.`);
                                            cy.task('writeCSV', {
                                                filePath: 'cypress/fixtures/applied/job_applications.csv',
                                                data: { jobId, timestamp, status: 'skipped' },
                                                headers: ['jobId', 'timestamp', 'status'],
                                                append: true
                                            });
                                            cy.task('updateStatusSummary', 'skipped');
                                        }
                                    });
                                } else {
                                    const errorMessage = `${timestamp} - Unexpected button text found: "${buttonText}" for job ID: ${jobId}`;
                                    cy.task('logApplicationError', errorMessage);
                                    cy.task('writeCSV', {
                                        filePath: 'cypress/fixtures/applied/job_applications.csv',
                                        data: { jobId, timestamp, status: 'fail' },
                                        headers: ['jobId', 'timestamp', 'status'],
                                        append: true
                                    });
                                    cy.task('updateStatusSummary', 'fail');
                                }
                            });
                        }
                    });
                }
            });
        });
  });
  