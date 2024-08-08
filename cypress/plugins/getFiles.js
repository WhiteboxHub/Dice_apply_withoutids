// cypress/plugins/getFiles.js
const fs = require('fs');
const path = require('path');

const getFilesFromDirectory = (directoryPath) => {
    const fullPath = path.resolve(directoryPath);
    const files = fs.readdirSync(fullPath);
    return files.map(file => path.join(fullPath, file));
};

module.exports = {
    getFilesFromDirectory
};