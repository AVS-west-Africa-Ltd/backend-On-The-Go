// utils/safeJSON.js

function safeJSONParse(value, fallback = null) {
    try {
      if (typeof value === 'string') {
        return JSON.parse(value);
      }
      return value; // already an object/array
    } catch (e) {
      console.warn('Invalid JSON:', value);
      return fallback;
    }
  }
  
  module.exports = { safeJSONParse };
  