export interface CurrencyOption {
  code: string;
  flag: string;
  name: string;
  symbol: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'USD', flag: '🇺🇸', name: 'US Dollar', symbol: '$' },
  { code: 'MYR', flag: '🇲🇾', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'EUR', flag: '🇪🇺', name: 'Euro', symbol: '€' },
  { code: 'GBP', flag: '🇬🇧', name: 'British Pound', symbol: '£' },
  { code: 'SGD', flag: '🇸🇬', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'JPY', flag: '🇯🇵', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', flag: '🇦🇺', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'INR', flag: '🇮🇳', name: 'Indian Rupee', symbol: '₹' },
];

export const DEFAULT_CURRENCY = 'USD';

export function currencyFlag(code: string | undefined): string {
  return CURRENCIES.find((c) => c.code === code)?.flag ?? '💵';
}
