
import { format } from 'date-fns';
describe('Apply for Jobs', () => {
    let jobIds = [];

    before(() => {
        // Ensure session management is correctly set up
        cy.session('login', () => {
            cy.loginDice(); // Custom command to login
        });

        // Read the file specified in the environment variable
        const filePath = Cypress.env('file');
        cy.task('readJsonFile', filePath).then((data) => {
            jobIds = data.ids; // Assuming JSON structure { "ids": [...] }
        });
    });

    it('Applies for jobs using Easy Apply for each job ID in the file', () => {
        // Iterate through each job ID and apply for job
        cy.wrap(jobIds).each((currentJobId) => {
            const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            const status = ' ';
            cy.applyForJob({ jobId: currentJobId, timestamp, status }); // Custom Cypress command to apply for the job
        }).then(() => {
            // Close the browser session after processing each file
            cy.reload();
        });
    });
});