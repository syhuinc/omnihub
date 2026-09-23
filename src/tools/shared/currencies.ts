export interface CurrencyOption {
  code: string;
  flag: string;
  name: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'USD', flag: '🇺🇸', name: 'US Dollar' },
  { code: 'MYR', flag: '🇲🇾', name: 'Malaysian Ringgit' },
  { code: 'EUR', flag: '🇪🇺', name: 'Euro' },
  { code: 'GBP', flag: '🇬🇧', name: 'British Pound' },
  { code: 'SGD', flag: '🇸🇬', name: 'Singapore Dollar' },
  { code: 'JPY', flag: '🇯🇵', name: 'Japanese Yen' },
  { code: 'AUD', flag: '🇦🇺', name: 'Australian Dollar' },
  { code: 'INR', flag: '🇮🇳', name: 'Indian Rupee' },
];

export const DEFAULT_CURRENCY = 'USD';

export function currencyFlag(code: string | undefined): string {
  return CURRENCIES.find((c) => c.code === code)?.flag ?? '💵';
}
