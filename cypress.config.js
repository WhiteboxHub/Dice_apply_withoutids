const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    specPattern: "cypress/e2e/**/*.cy.{js,jsx}",
    baseUrl: "https://www.dice.com/",
    includeShadowDom: true,
    pageLoadTimeout: 100000,
    defaultCommandTimeout: 10000,
    Dice_username:"",
    Dice_password:"",
    chromeWebSecurity: false,
    
      env: {
        categories: ["QA"], // Specify categories you want to process
        desktopPath: "/Users/Desktop" // Adjust the path as needed
      },
    setupNodeEvents(on, config) {
      // Load plugins file for custom tasks
      require('./cypress/plugins/index')(on, config);
      // Return the updated config
      return config;
    }
  },
  // implement node event listeners here
});