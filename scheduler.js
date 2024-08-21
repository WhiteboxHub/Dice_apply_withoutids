const cron = require('node-cron');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to clean up old JSON files
function cleanOldJsonFiles() {
    const directories = ['cypress/fixtures/ml', 'cypress/fixtures/qa', 'cypress/fixtures/ui'];
    const days = 30;
    const now = Date.now();
    const cutoffTime = now - days * 24 * 60 * 60 * 1000;

    directories.forEach((dir) => {
        fs.readdir(dir, (err, files) => {
            if (err) {
                console.error(`Error reading directory ${dir}:`, err);
                return;
            }

            files.forEach((file) => {
                const filePath = path.join(dir, file);

                // Check if the file has a .json extension
                if (path.extname(file) === '.json') {
                    // Get the file stats to check its age
                    fs.stat(filePath, (err, stats) => {
                        if (err) {
                            console.error(`Error getting stats of file ${filePath}:`, err);
                            return;
                        }

                        // Delete if the file is older than 30 days
                        if (stats.mtime.getTime() < cutoffTime) {
                            fs.unlink(filePath, (err) => {
                                if (err) {
                                    console.error(`Error deleting file ${filePath}:`, err);
                                } else {
                                    console.log(`Deleted old JSON file: ${filePath}`);
                                }
                            });
                        }
                    });
                }
            });
        });
    });
}

// Function to run Cypress tests
function runCypress() {
    execSync('npx cypress run', { stdio: 'inherit' });
}

// Schedule the task to run at 12:24 PM from Monday to Friday
cron.schedule('24 12 * * 1-5', () => {
    console.log('Starting cleanup of old JSON files...');
    try {
        cleanOldJsonFiles();
        console.log('Finished cleanup of old JSON files.');

        console.log('Running Cypress tests...');
        runCypress();
        console.log('Finished processing all files.');
    } catch (error) {
        console.error('Error during task execution:', error);
    }
});
