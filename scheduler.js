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
const appliedCountFilePath = path.join(__dirname, 'appliedCount.json');

// Global object to accumulate counts across files
let accumulatedCounts = {
    applied: 0,
    alreadyApplied: 0,
    noLongerAvailable: 0,
    failed: 0,
    skipped: 0
};

// Load existing accumulated counts if available
const loadExistingCounts = () => {
    if (fs.existsSync(appliedCountFilePath)) {
        try {
            const appliedCountData = fs.readFileSync(appliedCountFilePath, 'utf8').trim();
            const existingCounts = JSON.parse(appliedCountData);
            accumulatedCounts = { ...accumulatedCounts, ...existingCounts };
        } catch (error) {
            console.error('Error reading or parsing applied counts file:', error);
        }
    }
};

// Function to save accumulated counts to a file
const saveCounts = () => {
    try {
        fs.writeFileSync(appliedCountFilePath, JSON.stringify(accumulatedCounts, null, 2));
    } catch (error) {
        console.error('Error saving applied counts:', error);
    }
};

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

        const cypressProcess = exec(command);

        cypressProcess.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        cypressProcess.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        cypressProcess.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`Cypress process exited with code ${code}`));
            }
            resolve();
        });

        cypressProcess.on('error', (err) => {
            reject(err);
        });
    });
};

// Function to process all files in the directory
const processFiles = async () => {
    try {
        const files = await getFiles();
        console.log(`Files found: ${files}`);
        for (const file of files) {
            console.log(`Processing file: ${file}`);
            await runCypress(file);

            // Update and save counts after each file is processed
            saveCounts();
            console.log(`Finished processing file: ${file}`);
        }
    } catch (error) {
        console.error('Error processing files:', error);
    }
};

// Function to send email
const sendEmail = () => {
    let transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    let mailOptions = {
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_TO,
        subject: 'Daily Job Application Summary',
        text: `Summary:\nApplied: ${accumulatedCounts.applied || 0}\nAlready Applied: ${accumulatedCounts.alreadyApplied || 0}\nNo Longer Available: ${accumulatedCounts.noLongerAvailable || 0}\nFailed: ${accumulatedCounts.failed || 0}\nSkipped: ${accumulatedCounts.skipped || 0}`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};

// Schedule the task to run at 3:39 PM from Monday to Friday
cron.schedule('39 16 * * 1-5', async () => {
    console.log('Running Cypress tests...');
    try {
        loadExistingCounts(); // Load existing counts before processing files
        await processFiles();   // Process all files in the dynamically set directory
        console.log('Finished processing all files.');

        // Send email with the summary
        sendEmail();

    } catch (error) {
        console.error('Error during Cypress test execution:', error);
    }
});
