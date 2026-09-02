export function normalizeSectorColor(value: string | null | undefined): string | null {
  const hex = value?.trim().replace(/^#/, '');
  if (!hex) return null;
  if (/^[0-9a-f]{3}$/i.test(hex) || /^[0-9a-f]{6}$/i.test(hex)) return `#${hex}`;
  if (/^[0-9a-f]{4}$/i.test(hex)) return `#${hex.slice(1)}${hex[0]}`;
  if (/^[0-9a-f]{8}$/i.test(hex)) return `#${hex.slice(2)}${hex.slice(0, 2)}`;
  return null;
}
