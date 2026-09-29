export interface CurrencyOption {
  code: string;
  flag: string;
  name: string;
  symbol: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'MYR', flag: '🇲🇾', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'USD', flag: '🇺🇸', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', flag: '🇪🇺', name: 'Euro', symbol: '€' },
  { code: 'GBP', flag: '🇬🇧', name: 'British Pound', symbol: '£' },
  { code: 'JPY', flag: '🇯🇵', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', flag: '🇨🇳', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'SGD', flag: '🇸🇬', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'IDR', flag: '🇮🇩', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'INR', flag: '🇮🇳', name: 'Indian Rupee', symbol: '₹' },
  { code: 'KRW', flag: '🇰🇷', name: 'South Korean Won', symbol: '₩' },
  { code: 'THB', flag: '🇹🇭', name: 'Thai Baht', symbol: '฿' },
  { code: 'PHP', flag: '🇵🇭', name: 'Philippine Peso', symbol: '₱' },
  { code: 'AUD', flag: '🇦🇺', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', flag: '🇨🇦', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'HKD', flag: '🇭🇰', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'AED', flag: '🇦🇪', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', flag: '🇸🇦', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'CHF', flag: '🇨🇭', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'NZD', flag: '🇳🇿', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'BRL', flag: '🇧🇷', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'VND', flag: '🇻🇳', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'BND', flag: '🇧🇳', name: 'Brunei Dollar', symbol: 'B$' },
  { code: 'TRY', flag: '🇹🇷', name: 'Turkish Lira', symbol: '₺' },
  { code: 'MXN', flag: '🇲🇽', name: 'Mexican Peso', symbol: 'MX$' },
  { code: 'ZAR', flag: '🇿🇦', name: 'South African Rand', symbol: 'R' },
];

export const DEFAULT_CURRENCY = 'USD';

export function currencyFlag(code: string | undefined): string {
  return CURRENCIES.find((c) => c.code === code)?.flag ?? '💵';
}

export function currencySymbol(code: string | undefined): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? '$';
}

export function formatMoney(amount: number, code?: string): string {
  const symbol = currencySymbol(code ?? DEFAULT_CURRENCY);
  if (!Number.isFinite(amount)) return `${symbol}0.00`;
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
