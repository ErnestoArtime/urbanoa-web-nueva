import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OperationsService } from '../../../core/services/operations.service';
import { WalletService } from '../../../core/services/wallet.service';
import { AccountRefundComponent } from './refund.component';

describe('AccountRefundComponent', () => {
  function mount(): ReturnType<typeof TestBed.createComponent<AccountRefundComponent>> {
    const fixture = TestBed.createComponent(AccountRefundComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: WalletService,
          useValue: {
            source: signal('remote'),
            balance: signal(2),
            refund: jasmine.createSpy().and.resolveTo({ success: true, amount: 1 }),
            load: jasmine.createSpy().and.resolveTo(),
            cards: signal([
              { id: 'card-4021', brand: 'VISA', last4: '4021', expiryDate: '2027/05', cardholderName: 'Test' },
              { id: 'card-2403', brand: 'VISA', last4: '2403', expiryDate: '2027/05', cardholderName: 'test2' },
            ]),
            defaultCardId: signal('card-4021'),
            defaultCard: () => ({ id: 'card-4021', brand: 'VISA', last4: '4021', expiryDate: '2027/05', cardholderName: 'Test' }),
          },
        },
        { provide: OperationsService, useValue: { load: jasmine.createSpy().and.resolveTo() } },
      ],
    });
    TestBed.overrideComponent(AccountRefundComponent, { set: { template: '' } });
  });

  it('requests a refund from the remote balance contract without a fake card selector', async () => {
    const fixture = mount();

    fixture.componentInstance.requestRefund();
    await Promise.resolve();
    expect(fixture.componentInstance.refundQuote()).toBe(2);
  });

  it('keeps confirmation locked through refresh and reloads the remote wallet', async () => {
    const fixture = TestBed.createComponent(AccountRefundComponent);
    const wallet = TestBed.inject(WalletService);
    let finish!: () => void;
    const operations = TestBed.inject(OperationsService);
    (operations.load as jasmine.Spy).and.returnValue(new Promise<void>(resolve => finish = resolve));
    fixture.componentInstance.refundQuote.set(2);
    const pending = fixture.componentInstance.confirmRefund();
    await Promise.resolve();
    await fixture.componentInstance.confirmRefund();
    expect(wallet.refund).toHaveBeenCalledTimes(1);
    finish();
    await pending;
    expect(wallet.load).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.refundedAmount()).toBe(1);
  });
});
