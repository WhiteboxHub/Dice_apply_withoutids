import { format } from 'date-fns';
const os = require('os');
const path = require('path');

// Define the directory path
const categorie = Cypress.env('categories');
const homeDir = os.homedir();
const qaDirPath = path.join(homeDir, 'users', 'innovapathinc', 'Desktop', 'backup', 'cypress-fixtures', categorie);

describe('Apply for Jobs', () => {
    // Use an object to store job IDs by file name
    let jobsByFile = {};

    before(() => {
        // Ensure session management is correctly set up
        cy.session('login', () => {
            cy.loginDice(); // Custom command to log in
        });

        // Log the directory path
        console.log(`QA Directory Path: ${qaDirPath}`);

        // Get the list of files from the QA directory
        cy.task('listFilesInDir', qaDirPath).then((files) => {
            // Process each file in the directory
            files.forEach((file) => {
                const filePath = path.join(qaDirPath, file);
                cy.task('readJsonFile', filePath).then((data) => {
                    // Store job IDs by file name
                    jobsByFile[file] = data.ids || [];
                });
            });
        });
    });

    it('Applies for jobs using Easy Apply', () => {
        // Iterate over each file and its job IDs
        cy.wrap(Object.entries(jobsByFile)).each(([fileName, jobIds]) => {
            cy.log(`Processing file: ${fileName}`);

            // Apply for jobs using IDs from the current file
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
