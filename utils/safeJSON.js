// utils/safeJSON.js

// function safeJSONParse(value, fallback = null) {
//     try {
//       if (typeof value === 'string') {
//         return JSON.parse(value);
//       }
//       return value; // already an object/array
//     } catch (e) {
//       console.warn('Invalid JSON:', value);
//       return fallback;
//     }
//   }

function safeJSONParse(value, fallback = null) {
  if (value === null || value === undefined) return fallback;
  
  try {
    if (typeof value === 'string') {
      // Skip URL-like strings (http/https/data URIs)
      if (/^(https?|data):\/\//.test(value.trim())) {
        return value;
      }
      return JSON.parse(value);
    }
    return value; // Return non-strings as-is (arrays/objects/numbers)
  } catch (e) {
    console.warn(`Failed to parse JSON (returning fallback): ${value}`);
    return fallback;
  }
}
  
  module.exports = { safeJSONParse };
  
