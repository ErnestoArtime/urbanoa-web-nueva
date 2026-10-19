// The APK uses the device regional locale for EUR amounts, independently of the UI language.
const formatters = new Map<string, Intl.NumberFormat>();

function formatter(locale?: string): Intl.NumberFormat {
  const key = locale ?? '';
  let value = formatters.get(key);
  if (!value) {
    value = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });
    formatters.set(key, value);
  }
  return value;
}

export function formatEuro(amount: number, locale?: string): string {
  return formatter(locale).format(amount === 0 ? 0 : amount);
}

// Some APK/web catalogue messages already contain the currency symbol.
export function formatEuroNumber(amount: number, locale?: string): string {
  return formatter(locale)
    .formatToParts(amount === 0 ? 0 : amount)
    .filter((part) => part.type !== 'currency' && part.type !== 'literal')
    .map((part) => part.value)
    .join('');
}
