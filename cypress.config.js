const { defineConfig } = require("cypress");
const fs = require('fs'); 
const path = require('path');
require('dotenv').config();  // Load environment variables from .env file

module.exports = defineConfig({
  e2e: {
    specPattern: "cypress/e2e/**/*.cy.{js,jsx}",
    baseUrl: "https://www.dice.com/",
    includeShadowDom: true,
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: 1,
    pageLoadTimeout: parseInt(process.env.PAGE_LOAD_TIMEOUT) || 100000,
    defaultCommandTimeout: parseInt(process.env.DEFAULT_COMMAND_TIMEOUT) || 10000,
    chromeWebSecurity: false,

    env: {
      categories: process.env.CATEGORIES,

      credentials: {
        "you": {
          username: process.env.YOU_USERNAME,
          password: process.env.YOU_PASSWORD,
          apply: process.env.YOU_APPLY
        },
        "ha": {
          username: process.env.HA_USERNAME,
          password: process.env.HA_PASSWORD,
          apply: process.env.HA_APPLY
        },
        "dee": {
          username: process.env.DEE_USERNAME,
          password: process.env.DEE_PASSWORD,
          apply: process.env.DEE_APPLY
        }
      },
      defaultUserKey: process.env.DEFAULT_USER_KEY
    },

    setupNodeEvents(on, config) {
      // Load plugins file for custom tasks
      require('./cypress/plugins/index')(on, config);

      // Return the updated config
      return config;
    }
  }
});
