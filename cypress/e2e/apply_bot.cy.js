// Import necessary libraries
import { format } from 'date-fns';

describe('Apply for Jobs', () => {
    let jobIds = [];
    let accumulatedCounts = { 
        applied: 0,
        alreadyApplied: 0,
        noLongerAvailable: 0,
        failed: 0,
        skipped: 0
    };

 
    const category = Cypress.env('CATEGORY'); // Fetch category from environment

    before(() => {
        // Use the session for login, passing the category to loginDice
        cy.session('login', () => {
            cy.loginDice(category);
        });

        // Load job IDs from the specified JSON file
        const filePath = Cypress.env('file');
        cy.task('readJsonFile', filePath).then((data) => {
            jobIds = data.ids; 
        });
    });

    it('Applies for jobs using Easy Apply for each job ID in the file', () => {
        cy.wrap(jobIds).each((currentJobId) => {
            const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
            cy.applyForJob({ jobId: currentJobId, timestamp }).then((status) => {
                accumulatedCounts[status]++;
            });
        }).then(() => {
            cy.reload(); 
        });
    });

    // after(() => {
    //     // Save the accumulated counts to a file
    //    // cy.task('writeJsonFile', { filePath: 'appliedCounts.json', data: accumulatedCounts });
    //    // cy.writeAppliedCounts(); 
    // });
});
