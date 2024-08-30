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
        cypressProcess.on('exit', () => resolve());
    });
};

// Function to send an email report
const sendReportEmail = (reportFilePath) => {
    return new Promise((resolve, reject) => {
        // Read the file contents
        fs.readFile(reportFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error(`Error reading file: ${err.message}`);
                return reject(err);
            }

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
                to: process.env.EMAIL_TO,
                subject: 'Cypress Test Report',
                text: `Cypress test run completed for ${process.env.YOU_USERNAME}. Here is the report data:\n\n${data}`
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
    });
};

// Function to delete a file
const deleteFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error(`Error deleting file: ${err.message}`);
                return reject(err);
            }
            console.log(`File deleted: ${filePath}`);
            resolve();
        });
    });
};

// Schedule tasks using cron
cron.schedule('35 12 * * 1-5', async () => {
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
            // Delete the status_summary.json file after sending the email
            await deleteFile(summaryFilePath);
        } else {
            console.warn(`Summary file not found: ${summaryFilePath}`);
        }

    } catch (err) {
        console.error('Error in scheduled task:', err);
    }
});
