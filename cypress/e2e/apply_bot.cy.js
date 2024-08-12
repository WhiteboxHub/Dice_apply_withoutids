import { format } from 'date-fns';

describe('Apply for Jobs', () => {
    // Retrieve categories from environment variables or a default empty array
    const categories = Cypress.env('categories') || [];
    const desktopPath = Cypress.env('desktopPath');

    // Only process the specified categories
    categories.forEach((category) => {
        let jobIds = [];

        before(() => {
            // Ensure session management is correctly set up
            cy.session('login', () => {
                cy.loginDice(); // Custom command to log in
            });

            // Read the jobs.json file for the current category
            const filePath = `${desktopPath}/jobs-to-apply/${category}/jobs.json`;

            cy.task('readJsonFile', filePath).then((data) => {
                jobIds = data.ids; // Assuming JSON structure { "ids": [...] }
            });
        });

        it(`Applies for jobs in ${category} using Easy Apply`, () => {
            // Iterate through each job ID and apply for the job
            cy.wrap(jobIds).each((currentJobId) => {
                const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
                const status = ' ';
                cy.applyForJob({ jobId: currentJobId, timestamp, status }); // Custom Cypress command to apply for the job
            }).then(() => {
                // Reload the browser session after processing each file
                cy.reload();
            });
        });
    });
});
