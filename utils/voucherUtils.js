// voucherUtils.js
const crypto = require("crypto");

function generateUniqueCode() {
  // Generate a more readable code format (e.g., VCHR-XXXX-XXXX)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'VCHR-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  result += '-';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function validateVoucherDays(days) {
  const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  if (!Array.isArray(days)) {
    return { isValid: false, message: "Valid days must be an array" };
  }
  if (days.length === 0) {
    return { isValid: false, message: "At least one valid day must be specified" };
  }
  const invalidDays = days.filter(day => !validDays.includes(day));
  return {
    isValid: invalidDays.length === 0,
    message: invalidDays.length > 0 ? `Invalid days provided: ${invalidDays.join(', ')}` : null
  };
}

function validateVoucherExpiry(expiryDate) {
  const currentDate = new Date();
  const expiry = new Date(expiryDate);
  
  if (isNaN(expiry.getTime())) {
    return { isValid: false, message: "Invalid expiry date format" };
  }
  
  if (expiry <= currentDate) {
    return { isValid: false, message: "Expiry date must be in the future" };
  }
  
  // Optional: Set maximum expiry period (e.g., 1 year)
  const maxExpiry = new Date();
  maxExpiry.setFullYear(maxExpiry.getFullYear() + 1);
  
  if (expiry > maxExpiry) {
    return { isValid: false, message: "Expiry date cannot be more than 1 year in the future" };
  }
  
  return { isValid: true };
}

function canVoucherBeUsed(voucher) {
  // Parse validDays if it's a string
  const validDays = typeof voucher.validDays === 'string' 
    ? JSON.parse(voucher.validDays) 
    : voucher.validDays;

  // Rest of the logic...
  const today = new Date().toLocaleString('en-US', { weekday: 'long' });
  
  if (!validDays.includes(today)) {
    return { 
      canUse: false, 
      message: `This voucher is only valid on: ${validDays.join(', ')}` 
    };
  }

  return { canUse: true };
}

function canVoucherBeTraded(voucher) {
  if (!voucher) return { canTrade: false, message: "Voucher not found" };
  
  if (voucher.isUsed) {
    return { canTrade: false, message: "Used vouchers cannot be traded" };
  }
  
  if (new Date(voucher.expiryDate) < new Date()) {
    return { canTrade: false, message: "Expired vouchers cannot be traded" };
  }
  
  return { canTrade: true };
}

function formatVoucherForResponse(voucher) {
  if (!voucher) return null;
  
  return {
    ...voucher.toJSON ? voucher.toJSON() : voucher,
    validDays: Array.isArray(voucher.validDays) ? voucher.validDays : JSON.parse(voucher.validDays),
    previousOwners: Array.isArray(voucher.previousOwners) ? voucher.previousOwners : JSON.parse(voucher.previousOwners),
    usageHistory: Array.isArray(voucher.usageHistory) ? voucher.usageHistory : JSON.parse(voucher.usageHistory)
  };
}

module.exports = {
  generateUniqueCode,
  validateVoucherDays,
  validateVoucherExpiry,
  canVoucherBeUsed,
  canVoucherBeTraded,
  formatVoucherForResponse
};