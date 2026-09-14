import type { MainCard } from '../services/wallet.service';

/** Returns the last instant of a card's expiry month. Supports MM/YY and YYYY/MM. */
export function cardExpiryDate(value: string): Date | undefined {
  const match = value.trim().match(/^(\d{1,4})[\/-](\d{1,4})$/);
  if (!match) return undefined;
  const first = Number(match[1]);
  const second = Number(match[2]);
  const month = first >= 1 && first <= 12 ? first : second;
  const yearPart = first >= 1 && first <= 12 ? second : first;
  if (!month || month > 12 || !yearPart) return undefined;
  const year = yearPart < 100 ? 2000 + yearPart : yearPart;
  return new Date(year, month, 0, 23, 59, 59, 999);
}

export function isCardExpired(card: Pick<MainCard, 'expiryDate'>, now = new Date()): boolean {
  const expiry = cardExpiryDate(card.expiryDate);
  return expiry !== undefined && expiry.getTime() < now.getTime();
}

export function isCardUsable(card: Pick<MainCard, 'expiryDate'>, now = new Date()): boolean {
  const expiry = cardExpiryDate(card.expiryDate);
  return expiry !== undefined && expiry.getTime() >= now.getTime();
}
