const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec } = require('child_process');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
require('dotenv').config(); // Load environment variables from .env file

// Define paths and variables
const homeDir = os.homedir();
const category = process.env.CATEGORIES || 'default-category';
const qaDirPath = path.join(homeDir, 'Desktop', 'jobs_to_apply', category);

// Function to get the list of files
const getFiles = () => {
    return new Promise((resolve, reject) => {
        fs.readdir(qaDirPath, (err, files) => {
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
        const filePath = path.join(qaDirPath, file);
        const command = `npx cypress run --env file="${filePath}"`;
        console.log(`Executing command: ${command}`);

        const cypressProcess = exec(command, (err, stdout, stderr) => {
            if (err) {
                console.error(`Error executing Cypress: ${err}`);
                console.error(stderr); // Log stderr for more details
                return reject(err);
            }
            console.log(stdout); // Log stdout for Cypress output
            resolve();
        });

        // Listen for the 'exit' event to resolve the promise
        cypressProcess.on('exit', resolve);
    });
};

// Function to send an email report
const sendReportEmail = (reportFilePath) => {
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
            to: process.env.RECIPIENT_EMAIL, // Ensure this is set correctly
            subject: 'Cypress Test Report',
            text: `Cypress test run completed. Report: ${reportFilePath}`,
            attachments: [
                {
                    filename: 'status_summary.json',
                    path: reportFilePath
                }
            ]
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
cron.schedule('05 19 * * 1-5', async () => {
    try {
        const files = await getFiles();
        for (const file of files) {
            if (file.endsWith('.json')) {
                await runCypress(file);
            }
        }

        // Send email report with the status summary
        const summaryFilePath = path.join('cypress', 'fixtures', 'applied', 'status_summary.json');
        if (fs.existsSync(summaryFilePath)) {
            await sendReportEmail(summaryFilePath);
        } else {
            console.warn(`Summary file not found: ${summaryFilePath}`);
        }

    } catch (err) {
        console.error('Error in scheduled task:', err);
    }
});
