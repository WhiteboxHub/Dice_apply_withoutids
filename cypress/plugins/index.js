const fs = require('fs');
const path = require('path');
const { getFilesFromDirectory } = require('./getFiles');

// Function to append message to a file
const appendToFile = (filePath, message) => {
  try {
    fs.appendFileSync(filePath, `${message}\n`);
    return true;
  } catch (err) {
    console.error('Error appending to file', err);
    return false;
  }
};

function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

// Function to convert JSON to CSV format
function convertToCSV(data, headers) {
  const csvRows = [];

  data.forEach(row => {
    const values = headers.map(header => {
      const escaped = ('' + row[header]).replace(/"/g, '\\"'); // Escape double quotes
      return `"${escaped}"`; // Wrap values in double quotes
    });
    csvRows.push(values.join(',')); // Add data row
  });

  return csvRows.join('\n'); // Combine all rows with newline characters
}

// Function to write CSV file
function writeCSV(filePath, data, headers, append = true) {
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
}

// Define custom Cypress commands for file system operations
module.exports = (on, config) => {
  on('task', {
    ensureDirectoryExistence(filePath) {
      ensureDirectoryExistence(filePath);
      return null;
    },
    readJsonFile(filePath) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContent);
      } catch (err) {
        console.error('Error reading JSON file', err);
        return null;
      }
    },
    writeJsonFile({ filePath, data }) {
      try {
        const jsonData = JSON.stringify(data, null, 2);
        fs.writeFileSync(filePath, jsonData, 'utf8');
        console.log('JSON file written successfully');
        return null;
      } catch (err) {
        console.error('Error writing JSON file', err);
        return err.message;
      }
    },
    logInfo(message) {
      const logPath = path.join(__dirname, '..', 'cypress', 'logs', 'info.log');
      ensureDirectoryExistence(logPath);
      appendToFile(logPath, message);
      return null;
    },
    logError(message) {
      const logPath = path.join(__dirname, '..', 'cypress', 'logs', 'error.log');
      ensureDirectoryExistence(logPath);
      appendToFile(logPath, message);
      return null;
    },
    logApplicationInfo(message) {
      const logPath = path.join(__dirname, '..', 'applylogs', 'info.log');
      ensureDirectoryExistence(logPath);
      appendToFile(logPath, message);
      return null;
    },
    logApplicationError(message) {
      const logPath = path.join(__dirname, '..', 'applylogs', 'error.log');
      ensureDirectoryExistence(logPath);
      appendToFile(logPath, message);
      return null;
    },
    writeCSV({ filePath, data, headers, append }) {
      return writeCSV(filePath, data, headers, append);
    },
    getFilesFromDirectory(directory) {
      return getFilesFromDirectory(directory);
    },
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
    exitProcess() {
      process.exit(0);
    }
  });

  return config;
};