const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    specPattern: "cypress/e2e/**/*.cy.{js,jsx}",
    baseUrl: "https://www.dice.com/",
    includeShadowDom: true,
    pageLoadTimeout: 100000,
    defaultCommandTimeout: 10000,
    chromeWebSecurity: false,
    
      env: {
        categories: ["QA"], // Specify categories you want to process
        desktopPath: "/Users/Desktop" ,
        credentials: {
          "you": {
            username: "you@example.com",
            password: "your_password",
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
      // Load plugins file for custom tasks
      require('./cypress/plugins/index')(on, config);
      // Return the updated config
      return config;
    }
  },
  // implement node event listeners here
});