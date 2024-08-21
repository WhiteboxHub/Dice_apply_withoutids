import { format } from 'date-fns';
const os = require('os');
const path = require('path');

describe('Apply for Jobs', () => {
    let homeDir;
    let qaDirPath;

    before(() => {
        // Fetch and validate the home directory
        cy.task('getHomeDir').then((dir) => {
            homeDir = dir;
            cy.log('Home Directory:', homeDir);

            // Determine the user directory name based on the platform
            let userDir;
            if (Cypress.platform === 'win32') {
                // Windows
                userDir = 'Users';
            } else {
                // macOS/Linux
                userDir = ''; // No additional directory needed for macOS/Linux
            }

            // Construct the QA directory path
            const categorie = Cypress.env('categories') || 'default-category';
            qaDirPath = path.join(homeDir, userDir, 'Desktop', 'backup', 'cypress-fixtures', categorie);

            // Log the directory path
            cy.log(`QA Directory Path: ${qaDirPath}`);
        });
    });

    // Use an object to store job IDs by file name
    let jobsByFile = {};

    before(() => {
        // Ensure session management is correctly set up
        cy.session('login', () => {
            cy.loginDice(); // Custom command to log in
        });

        // Get the list of files from the QA directory
        cy.task('listFilesInDir', qaDirPath).then((files) => {
            // Process each file in the directory
            files.forEach((file) => {
                const filePath = path.join(qaDirPath, file);
                cy.task('readJsonFile', filePath).then((data) => {
                    if (data && data.ids) {
                        jobsByFile[file] = data.ids;
                    } else {
                        cy.log(`No 'ids' property found in file: ${file}`);
                        jobsByFile[file] = [];
                    }
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
