import { cardExpiryDate, isCardExpired, isCardUsable } from './card-expiry';

describe('card-expiry', () => {
  it('interprets MM/YY and YYYY/MM as the end of the expiry month', () => {
    expect(cardExpiryDate('12/30')?.getFullYear()).toBe(2030);
    expect(cardExpiryDate('2027/05')?.getMonth()).toBe(4);
  });

  it('marks a card expired only after the last instant of its month', () => {
    const beforeEnd = new Date(2027, 4, 31, 23, 59, 59);
    const afterEnd = new Date(2027, 5, 1);
    const card = { expiryDate: '2027/05' };
    expect(isCardUsable(card, beforeEnd)).toBeTrue();
    expect(isCardExpired(card, afterEnd)).toBeTrue();
  });

  it('treats malformed expiry data as unusable but not as a known expired card', () => {
    const card = { expiryDate: '' };
    expect(isCardUsable(card)).toBeFalse();
    expect(isCardExpired(card)).toBeFalse();
  });
});
