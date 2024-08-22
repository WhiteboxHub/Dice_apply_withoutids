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
function sendEmail(appliedCount) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
             user: 'dicedetails1@gmail.com',
            pass: 'hyqn gdee qoks erdq',
        }
    });

    let mailOptions = {
        from: 'dicedetails1@gmail.com',
          to: 'shivapatel098k@gmail.com',
        subject: 'Daily Job Application Summary',
        text: `You have successfully applied for ${appliedCount} jobs today.`
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
cron.schedule('18 13  * * 1-5', () => {
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
