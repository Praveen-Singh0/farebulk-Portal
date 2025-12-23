// Currency conversion utility for frontend
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  INR: 89.55, 
  EUR: 0.85,  
  GBP: 0.74,  
  CAD: 1.37, 
  AUD: 1.50   
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$'
};

export const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar',
  INR: 'Indian Rupee',
  EUR: 'Euro',
  GBP: 'British Pound',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar'
};

/**
 * Convert amount from one currency to another
 */
export const convertCurrency = (
  amount: number | string,
  fromCurrency: string = 'USD',
  toCurrency: string = 'USD'
): number => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (!numAmount || isNaN(numAmount)) return 0;
  
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  
  if (from === to) return numAmount;
  
  // Convert to USD first, then to target currency
  const amountInUSD = numAmount / (EXCHANGE_RATES[from] || 1);
  const convertedAmount = amountInUSD * (EXCHANGE_RATES[to] || 1);
  
  return parseFloat(convertedAmount.toFixed(2));
};

/**
 * Get exchange rate between two currencies
 */
export const getExchangeRate = (
  fromCurrency: string = 'USD',
  toCurrency: string = 'USD'
): number => {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  
  if (from === to) return 1;
  
  const rate = (EXCHANGE_RATES[to] || 1) / (EXCHANGE_RATES[from] || 1);
  return parseFloat(rate.toFixed(4));
};

/**
 * Format currency with symbol
 */
export const formatCurrency = (
  amount: number | string,
  currency: string = 'USD',
  showCode: boolean = false
): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) return `${CURRENCY_SYMBOLS[currency] || currency}0.00`;
  
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
  const formattedAmount = numAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  if (showCode) {
    return `${symbol}${formattedAmount} ${currency.toUpperCase()}`;
  }
  
  return `${symbol}${formattedAmount}`;
};

/**
 * Get all supported currencies
 */
export const getSupportedCurrencies = (): string[] => {
  return Object.keys(EXCHANGE_RATES);
};

/**
 * Calculate sale amount (MCO - 15% deduction)
 */
export const calculateSale = (mco: string | number, currency: string = 'USD'): {
  original: number;
  usd: number;
  currency: string;
} => {
  const mcoAmount = typeof mco === 'string' ? parseFloat(mco) : mco;
  
  if (isNaN(mcoAmount)) {
    return { original: 0, usd: 0, currency };
  }
  
  const saleOriginal = mcoAmount - (mcoAmount * 0.15);
  const saleUSD = currency !== 'USD' 
    ? convertCurrency(saleOriginal, currency, 'USD')
    : saleOriginal;
  
  return {
    original: parseFloat(saleOriginal.toFixed(2)),
    usd: parseFloat(saleUSD.toFixed(2)),
    currency
  };
};
