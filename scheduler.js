const cron = require('node-cron');
const { execSync } = require('child_process');

// Function to run Cypress tests
function runCypress() {
    execSync('npx cypress run', { stdio: 'inherit' });
}

// Schedule the task to run at 12:24 PM from Monday to Friday
cron.schedule('24 12 * * 1-5', () => {
    console.log('Running Cypress tests...');
    try {
        runCypress();
        console.log('Finished processing all files.');
    } catch (error) {
        console.error('Error during Cypress test execution:', error);
    }
});
