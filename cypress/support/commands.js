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
require('dotenv').config();
// Helper function to get credentials based on role
function getCredentials(role) {
    switch (role) {
        case 'ML':
            return {
                username: Cypress.env('credentials_ML_user_username'),
                password: Cypress.env('credentials_ML_user_password'),
                apply: Cypress.env('credentials_ML_user_apply'),
            };
        case 'QA':
            return {
                username: Cypress.env('credentials_QA_user_username'),
                password: Cypress.env('credentials_QA_user_password'),
                apply: Cypress.env('credentials_QA_user_apply'),
            };
        case 'UI':
            return {
                username: Cypress.env('credentials_UI_user_username'),
                password: Cypress.env('credentials_UI_user_password'),
                apply: Cypress.env('credentials_UI_user_apply'),
            };
        default:
            throw new Error('Invalid role specified. Use "ML", "QA", or "UI".');
    }
}

// Cypress custom command to log in to Dice
Cypress.Commands.add('loginDice', (role) => {
    const credentials = getCredentials(role);

     console.log(credentials);

    if (credentials.apply !== 's') {
        cy.log(`Skipping application for role: ${role}`);
        return;
    }
  
    // Visit the login page and perform login
    cy.visit('https://www.dice.com/dashboard/login');
  
    // Fill in email and password
    cy.get('input[placeholder="Please enter your email"][type="email"][name="email"]')
      .type(credentials.username);
    cy.get('button[data-testid="sign-in-button"]').click().wait(2000);
  
    cy.get('input[placeholder="Enter Password"]').type(credentials.password);
    cy.get('button[data-testid="submit-password"]').click();
  
    // Wait for login and perform any other actions
    cy.wait(5000);
});

  
  


const path = require('path');
Cypress.Commands.add('applyForJob', ({ jobId, timestamp }) => {
    cy.visit(`https://www.dice.com/job-detail/${jobId}`, { failOnStatusCode: false, timeout: 35000 })
        .then(() => {
            cy.wait(5000)
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
                    cy.wait(10000);
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
                            cy.wait(10000);
                            cy.get('.hydrated').shadow().find('button').then($button => {
                                const buttonText = $button.text().trim();
                                if (buttonText.includes('Easy apply')) {
                                    cy.task('logApplicationInfo', `${timestamp} - Easy apply button found for job ID: ${jobId}`);
                                    cy.get('#applyButton > .hydrated').click({ timeout: 5000 });
                                    cy.contains('span[data-v-5a80815f]', 'Next', { timeout: 3000 }).click();
                                    
                                    cy.get('span[data-v-5a80815f]', { timeout: 5000 }).then($submitButton => {
                                        if ($submitButton.text().trim().includes('Submit')) {
                                            cy.wrap($submitButton).click();
                                            cy.wait(3000);
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
  