import { format } from 'date-fns';
const os = require('os');
const path = require('path');

describe('Apply for Jobs', () => {
  

    let homeDir;
    let qaDirPath;
    let appliedCount = 0; // Variable to track applied jobs
    
    before(() => {
        // Get the home directory using a Cypress task
        cy.task('getHomeDir').then((dir) => {
            homeDir = dir;
            cy.log('Home Directory:', homeDir);
    
            // Determine the correct user directory and construct the full path to the QA directory
            const category = Cypress.env('categories') || 'default-category';
    
            if (Cypress.platform === 'win32') {
                // For Windows, handle path by appending `Desktop` and other directories properly
                const userProfile = Cypress.env('USERPROFILE') || path.basename(homeDir);
                qaDirPath = path.join(homeDir, 'Desktop', 'jobs_to_apply',  category);
            } else {
                // For macOS/Linux, simply append `Desktop` and other directories
                qaDirPath = path.join(homeDir, 'Desktop', 'jobs_to_apply', category);
            }
    
            cy.log(`${category} Directory Path: ${qaDirPath}`);
        });
    });
    

    let jobsByFile = {};

    before(() => {
        cy.session('login', () => {
            cy.loginDice();
        });

        cy.task('listFilesInDir', qaDirPath).then((files) => {
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
        cy.wrap(Object.entries(jobsByFile)).each(([fileName, jobIds]) => {
            cy.log(`Processing file: ${fileName}`);

            cy.wrap(jobIds).each((currentJobId) => {
                const timestamp = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
                const status = ' ';

                // Call the custom command to apply for the job
                cy.applyForJob({ jobId: currentJobId, timestamp, status }).then((response) => {
                    if (response.status === 'applied') {
                        appliedCount++; // Increment the counter on successful application
                    }
                });
            }).then(() => {
                cy.reload();
            });
        });
    });

    after(() => {
        cy.task('logApplicationInfo', `Total jobs applied for today: ${appliedCount}`);
        cy.task('saveAppliedCount', appliedCount); // Save the count to a file or DB for email reporting
    });
});
