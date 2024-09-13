const fs = require('fs');
const path = require('path');
const os = require('os');

// Path to the summary file
const summaryFilePath = path.join('cypress', 'fixtures', 'applied', 'status_summary.json');

// Function to append a message to a file
const appendToFile = (filePath, message) => {
  try {
    fs.appendFileSync(filePath, `${message}\n`);
    return true;
  } catch (err) {
    console.error('Error appending to file', err);
    return false;
  }
};

// Function to ensure the directory exists
const ensureDirectoryExistence = (filePath) => {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
};

// Convert data to CSV format
const convertToCSV = (data, headers) => {
  const csvRows = [];
  data.forEach(row => {
    const values = headers.map(header => {
      const escaped = ('' + row[header]).replace(/"/g, '\\"'); // Escape double quotes
      return `"${escaped}"`; // Wrap values in double quotes
    });
    csvRows.push(values.join(',')); // Add data row
  });
  return csvRows.join('\n'); // Combine all rows with newline characters
};

// Function to write CSV file
const writeCSV = (filePath, data, headers, append = true) => {
  try {
    // Ensure data is always an array
    const dataArray = Array.isArray(data) ? data : [data];
    const csv = convertToCSV(dataArray, headers); // Convert data to CSV format

    // Determine write mode
    const options = { flag: append ? 'a' : 'w' };

    // Check if the file exists and is empty or new
    const fileExists = fs.existsSync(filePath);
    const isEmpty = fileExists ? fs.readFileSync(filePath, 'utf8').trim().length === 0 : true;

    // Write header if the file is new or empty
    if (!fileExists || isEmpty) {
      fs.writeFileSync(filePath, headers.join(',') + '\n', { flag: 'w' });
    }

    fs.writeFileSync(filePath, csv + '\n', options);
    console.log('CSV file written successfully');
    return true;
  } catch (err) {
    console.error('Error writing CSV file', err);
    return false;
  }
};

// Initialize or update the status summary file
const updateStatusSummary = (status) => {
  if (!fs.existsSync(summaryFilePath)) {
    fs.writeFileSync(summaryFilePath, JSON.stringify({ applied: 0, noLonger: 0, alreadyApplied: 0, fail: 0, skipped: 0 }, null, 2));
  }

  const summary = JSON.parse(fs.readFileSync(summaryFilePath, 'utf8'));
  if (summary.hasOwnProperty(status)) {
    summary[status] += 1;
    fs.writeFileSync(summaryFilePath, JSON.stringify(summary, null, 2));
  } else {
   // console.error(`Invalid status: ${status}`);
  }
};

// Export Cypress plugin functions
module.exports = (on, config) => {
  on('task', {
    // Ensure directory existence
    ensureDirectoryExistence(filePath) {
      ensureDirectoryExistence(filePath);
      return null;
    },

    // List files in directory
    listFilesInDir(dir) {
      return new Promise((resolve, reject) => {
        fs.readdir(dir, (err, files) => {
          if (err) {
            return reject(err);
          }
          resolve(files);
        });
      });
    },

    // Read JSON file
    readJsonFile(filePath) {
      try {
        const absolutePath = path.resolve(filePath);
        if (fs.existsSync(absolutePath)) {
          const data = fs.readFileSync(absolutePath, 'utf8');
          const parsedData = JSON.parse(data);
          return parsedData; // Ensure the JSON structure matches what you expect
        } else {
          throw new Error(`File not found: ${absolutePath}`);
        }
      } catch (error) {
        console.error(`Error reading JSON file: ${error.message}`);
        return null; // Return null in case of an error
      }
    },

    // Write JSON file
    writeJsonFile({ filePath, data }) {
      try {
        const jsonData = JSON.stringify(data, null, 2);
        fs.writeFileSync(filePath, jsonData, 'utf8');
        console.log('JSON file written successfully');
        return null;
      } catch (err) {
        console.error('Error writing JSON file:', err.message);
        return err.message;
      }
    },

    // Get home directory path
    getHomeDir() {
      return os.homedir();
    },

    // Log application info
    logApplicationInfo(message) {
      const logPath = path.join(__dirname, '..', 'applylogs', 'info.log');
      ensureDirectoryExistence(logPath);
      appendToFile(logPath, message);
      return null;
    },

    // Log application errors
    logApplicationError(message) {
      const logPath = path.join(__dirname, '..', 'applylogs', 'error.log');
      ensureDirectoryExistence(logPath);
      appendToFile(logPath, message);
      return null;
    },

    // Log general info
    logInfo(message) {
      const logPath = path.join(__dirname, '..', 'cypress', 'logs', 'info.log');
      ensureDirectoryExistence(logPath);
      appendToFile(logPath, message);
      return null;
    },

    // Log general errors
    logError(message) {
      const logPath = path.join(__dirname, '..', 'cypress', 'logs', 'error.log');
      ensureDirectoryExistence(logPath);
      appendToFile(logPath, message);
      return null;
    },

    // Write CSV file
    writeCSV({ filePath, data, headers, append }) {
      return writeCSV(filePath, data, headers, append);
    },

    // Delete file
    deleteFile(filePath) {
      return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
          if (err) {
            return reject(err);
          }
          resolve(null);
        });
      });
    },
    logInCategory(category) {
      return new Promise((resolve, reject) => {
        // Execute the Cypress command with category-specific credentials
        exec(`npx cypress run --env category=${category}`, (err, stdout, stderr) => {
          if (err) {
           // console.error(`Error executing Cypress: ${err}`);
           console.error(stderr);
         //   return reject(err);
          }
          console.log(stdout);
          resolve();
        });
      });
    },

    // Exit process
    exitProcess() {
      process.exit(0);
    },

    // Update status summary
    updateStatusSummary(status) {
      updateStatusSummary(status);
      return null;
    }
  });

  return config;
};
