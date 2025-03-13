// utils/logger.js
const fs = require('fs');

const log = (message, username = 'SYSTEM') => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [User: ${username}] ${message}\n`;
  fs.appendFileSync('server.log', logMessage); // Log to a file
  console.log(logMessage); // Log to console
};

module.exports = log;