import { WalletService } from './wallet.service';

describe('WalletService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('credits balance and records a top-up movement', () => {
    const service = new WalletService();

    service.credit(10, { type: 'top-up', descriptionKey: 'wallet.movement.topUp' });

    expect(service.balance()).toBe(22.5);
    expect(service.movements()[0].type).toBe('top-up');
    expect(service.movements()[0].amount).toBe(10);
  });

  it('does not debit when balance is insufficient', () => {
    const service = new WalletService();

    const paid = service.debit(99, { type: 'fine-payment', descriptionKey: 'wallet.movement.finePayment' });

    expect(paid).toBeFalse();
    expect(service.balance()).toBe(12.5);
    expect(service.movements().length).toBe(0);
  });
});
