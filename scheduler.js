// scheduler.js

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os'); // Import the os module to get the user's home directory
const cron = require('node-cron');

// Construct the path to the Desktop directory where the files are extracted
const desktopPath = path.join(os.homedir(), 'Desktop', 'jobs-to-apply');

// Function to get the list of files
const getFiles = () => {
    return new Promise((resolve, reject) => {
        fs.readdir(desktopPath, (err, files) => {
            if (err) {
                return reject(err);
            }
            resolve(files);
        });
    });
};

// Function to run Cypress tests
const runCypress = (file) => {
    return new Promise((resolve, reject) => {
        const command = `npx cypress run --env file="${path.join(desktopPath, file)}" --spec cypress/e2e/applyJobs.cy.js`; // Specify the Cypress spec file
        const cypressProcess = exec(command, (err, stdout, stderr) => {
            if (err) {
                console.error(`Error executing Cypress: ${err}`);
                return reject(err);
            }
            console.log(stdout);
            if (stderr) {
                console.error(`Cypress stderr: ${stderr}`);
            }
            resolve();
        });

        // Listen for the 'exit' event to resolve the promise
        cypressProcess.on('exit', resolve);
    });
};

// Function to process all files in the directory
const processFiles = async () => {
    try {
        const files = await getFiles();
        for (const file of files) {
            await runCypress(file);
            console.log(`Finished processing file: ${file}`);
        }
    } catch (error) {
        console.error('Error processing files:', error);
    }
};

// Schedule the job to run daily at 8:00 AM from Monday to Friday
cron.schedule('0 8 * * 1-5', () => {
    console.log('Running Cypress tests...');
    processFiles().then(() => {
        console.log('Finished processing all files.');
    }).catch((error) => {
        console.error('Error during Cypress test execution:', error);
    });
});

console.log('Scheduler is set up. Cypress tests will run daily at 8:00 AM from Monday to Friday.');
