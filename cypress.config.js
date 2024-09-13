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
    numTestsKeptInMemory: 0,
    pageLoadTimeout: parseInt(process.env.PAGE_LOAD_TIMEOUT) || 100000,
    defaultCommandTimeout: parseInt(process.env.DEFAULT_COMMAND_TIMEOUT) || 10000,
    chromeWebSecurity: false,

    env: {
      categories: process.env.CATEGORIES,
      credentials_ML_user_username: process.env.CREDENTIALS_ML_USER_USERNAME,
      credentials_ML_user_password: process.env.CREDENTIALS_ML_USER_PASSWORD,
      credentials_ML_user_apply: process.env.CREDENTIALS_ML_USER_APPLY,

      credentials_QA_user_username: process.env.CREDENTIALS_QA_USER_USERNAME,
      credentials_QA_user_password: process.env.CREDENTIALS_QA_USER_PASSWORD,
      credentials_QA_user_apply: process.env.CREDENTIALS_QA_USER_APPLY,

      credentials_UI_user_username: process.env.CREDENTIALS_UI_USER_USERNAME,
      credentials_UI_user_password: process.env.CREDENTIALS_UI_USER_PASSWORD,
      credentials_UI_user_apply: process.env.CREDENTIALS_UI_USER_APPLY,
     
      
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
