const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const isValidAddress = (address) => {
  if (!isNonEmptyString(address)) return false;  
  return /^[0-9a-fA-F]{128}$/.test(address);
};

const isValidAmount = (amount) => {
  const parsed = parseFloat(amount);
  return !isNaN(parsed) && isFinite(parsed) && parsed > 0;
};

const sanitizeAddress = (address) => String(address).trim();

const sanitizeAmount = (amount) => parseFloat(amount);

module.exports = {
  isNonEmptyString,
  isValidAddress,
  isValidAmount,
  sanitizeAddress,
  sanitizeAmount,
};
