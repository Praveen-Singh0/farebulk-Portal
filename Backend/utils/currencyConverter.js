// Currency conversion utility
// Exchange rates (you can update these or fetch from an API)
const EXCHANGE_RATES = {
  USD: 1,
  INR: 89.55,
  EUR: 0.85,
  GBP: 0.74,
  CAD: 1.37,
  AUD: 1.50
};


/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {number} Converted amount
 */
const convertCurrency = (amount, fromCurrency = 'USD', toCurrency = 'USD') => {
  if (!amount || isNaN(amount)) return 0;

  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  // If same currency, return original amount
  if (from === to) return parseFloat(amount);

  // Convert to USD first, then to target currency
  const amountInUSD = parseFloat(amount) / (EXCHANGE_RATES[from] || 1);
  const convertedAmount = amountInUSD * (EXCHANGE_RATES[to] || 1);

  return parseFloat(convertedAmount.toFixed(2));
};

/**
 * Get exchange rate between two currencies
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {number} Exchange rate
 */
const getExchangeRate = (fromCurrency = 'USD', toCurrency = 'USD') => {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  if (from === to) return 1;

  const rate = (EXCHANGE_RATES[to] || 1) / (EXCHANGE_RATES[from] || 1);
  return parseFloat(rate.toFixed(4));
};

/**
 * Format currency with symbol
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount, currency = 'USD') => {
  const symbols = {
    USD: '$',
    INR: '₹',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$'
  };

  const symbol = symbols[currency.toUpperCase()] || currency;
  const formattedAmount = parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return `${symbol}${formattedAmount}`;
};

/**
 * Get all supported currencies
 * @returns {Array} Array of currency codes
 */
const getSupportedCurrencies = () => {
  return Object.keys(EXCHANGE_RATES);
};

module.exports = {
  convertCurrency,
  getExchangeRate,
  formatCurrency,
  getSupportedCurrencies,
  EXCHANGE_RATES
};
