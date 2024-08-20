const { defineConfig } = require("cypress");
const fs = require('fs'); 
const path = require('path');

module.exports = defineConfig({
  e2e: {
    specPattern: "cypress/e2e/**/*.cy.{js,jsx}",
    baseUrl: "https://www.dice.com/",
    includeShadowDom: true,
    pageLoadTimeout: 100000,
    defaultCommandTimeout: 10000,
    chromeWebSecurity: false,
    
      env: {
        categories: 'QA', // Specify categories you want to process
        
        credentials: {
          "you": {
            username: "na@gmail.com",
            password: "Innov1",
            apply: "s"
          },
          "ha": {
            username: "ha@example.com",
            password: "your_password",
            apply: "n"
          },
          "dee": {
            username: "de@example.com",
            password: "your_password",
            apply: "n"
          }
        },
        defaultUserKey: "you" // Add this line
      },// Adjust the path as needed
      
      setupNodeEvents(on, config) {
        // Ensure the backup directory exists
        // const backupDir = path.join(__dirname,'backup', 'cypress-fixtures');
        // if (!fs.existsSync(backupDir)) {
        //   fs.mkdirSync(backupDir, { recursive: true });
        // }
  
        // // Set the fixturesFolder dynamically
        // config.fixturesFolder = backupDir;
  
        // Load plugins file for custom tasks
        require('./cypress/plugins/index')(on, config);
  
        // Return the updated config
        return config;
      }
  },
  // implement node event listeners here
});