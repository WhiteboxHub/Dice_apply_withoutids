const cron = require('node-cron');
const { execSync } = require('child_process');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Function to run Cypress tests
function runCypress() {
    execSync('npx cypress run', { stdio: 'inherit' });
}

// Function to send email
function sendEmail(appliedCounts) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'dil.com',
            pass: 'ovaath1',
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    let mailOptions = {
        from: '1@gmail.com',
        to: 'shixample.com',
        subject: 'Daily Job Application Summary',
        text: `Summary:\nApplied: ${appliedCounts.applied}\nAlready Applied: ${appliedCounts.alreadyApplied}\nNo Longer Available: ${appliedCounts.noLongerAvailable}\nFailed: ${appliedCounts.failed}`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}


// Schedule the task to run at 12:24 PM from Monday to Friday
cron.schedule('27 16 * * 1-5', () => {
    console.log('Running Cypress tests...');
    try {
        runCypress();
        console.log('Finished processing all files.');

        // After running Cypress, read the applied count from a file
        const appliedCountFilePath = path.join(__dirname, 'appliedCount.txt');
        const appliedCount = fs.readFileSync(appliedCountFilePath, 'utf8');
        sendEmail(appliedCount.trim());

    } catch (error) {
        console.error('Error during Cypress test execution:', error);
    }
});
