const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
require('dotenv').config(); // Load environment variables from .env file

// Define paths and variables
const homeDir = os.homedir();
const categories = process.env.CATEGORIES ? process.env.CATEGORIES.split(' ') : ['default-category'];

// Function to get the list of files for a given category
const getFiles = (category) => {
    const categoryDirPath = path.join(homeDir, 'Desktop', 'jobs_to_apply', category);
    return new Promise((resolve, reject) => {
        fs.readdir(categoryDirPath, (err, files) => {
            if (err) {
                return reject(err);
            }
            resolve(files);
        });
    });
};

// Function to run Cypress tests
const runCypress = (category, file) => {
    return new Promise((resolve, reject) => {
        const filePath = path.join(homeDir, 'Desktop', 'jobs_to_apply', category, file);
        const command = `npx cypress run --env file="${filePath}",CATEGORY="${category}"`;
        console.log(`Executing command: ${command}`);

        const cypressProcess = exec(command, (err, stdout, stderr) => {
            if (err) {
              //  console.error(`Error executing Cypress: ${err}`);
               // console.error(stderr); // Log stderr for more details
               // return reject(err);
            }
            console.log(stdout); // Log stdout for Cypress output
            resolve();
        });

        // Listen for the 'exit' event to resolve the promise
        cypressProcess.on('exit', resolve);
    });
};


// Function to send an email report
const sendReportEmail = (reportData) => {
    return new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false // Bypass SSL validation for testing
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_TO, // Ensure this is set correctly
            subject: 'Cypress Test Report from ',
            text: `Cypress test run completed for ${process.env.YOU_USERNAME}. Here is the summary:\n\n` +
                `Applied: ${reportData.applied}\n` +
                `No Longer Available: ${reportData.noLonger}\n` +
                `Already Applied: ${reportData.alreadyApplied}\n` +
                `Failed: ${reportData.fail}\n` +
                `Skipped: ${reportData.skipped}\n`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(`Error sending email: ${error.message}`);
                return reject(error);
            }
            console.log('Email sent: ' + info.response);
            resolve();
        });
    });
};

// Schedule tasks using cron
cron.schedule('55 20 * * *', async () => {
    try {
        for (const category of categories) {
            const files = await getFiles(category);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    // Pass category as an environment variable
                    await runCypress(category, file);
                }
            }
        }

        // Read the status summary JSON file
        const summaryFilePath = path.join('cypress', 'fixtures', 'applied', 'status_summary.json');
        if (fs.existsSync(summaryFilePath)) {
            const summaryData = JSON.parse(fs.readFileSync(summaryFilePath, 'utf8'));
            await sendReportEmail(summaryData);

            // Delete the summary file after sending the email
            fs.unlinkSync(summaryFilePath);
            console.log(`Deleted summary file: ${summaryFilePath}`);
        } else {
            console.warn(`Summary file not found: ${summaryFilePath}`);
        }

    } catch (err) {
        console.error('Error in scheduled task:', err);
    }
});