import fs from 'fs';

export const log = (message: string, username: string = 'SYSTEM', userId: number | null = null): void => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [User: ${username} with ID: ${userId}] ${message}\n`;

  // Append to file
  fs.appendFileSync('server.log', logMessage);

  // Print to console
  console.log(logMessage);
};
