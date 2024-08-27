// If you are using format from 'date-fns', make sure to use it
import { format } from 'date-fns';

describe('Apply for Jobs', () => {
    let jobIds = [];
    let accumulatedCounts = { // Define here to be used in after hook
        applied: 0,
        alreadyApplied: 0,
        noLongerAvailable: 0,
        failed: 0,
        skipped: 0
    };
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
        cy.wrap(jobIds).each((currentJobId) => {
            const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
            cy.applyForJob({ jobId: currentJobId, timestamp }).then((status) => {
                accumulatedCounts[status]++;
            });
        }).then(() => {
            cy.reload();
        });
    });

    after(() => {
        cy.writeAppliedCounts(); // Ensure this task is properly defined
    });
});
