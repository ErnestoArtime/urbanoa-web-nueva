import { OpsApiError } from '../../../core/api/ops-api.types';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OperationsService } from '../../../core/services/operations.service';
import { WalletService } from '../../../core/services/wallet.service';
import { AccountRefundComponent } from './refund.component';

describe('AccountRefundComponent', () => {
  beforeEach(() => sessionStorage.clear());
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
            loading: signal(false),
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

  it('retains the OPS error for display even when the refund outcome is uncertain', async () => {
    const error = new OpsApiError('backend', 'RefundUserCreditAPI', 'unused', 200, {
      code: -9,
      type: 2,
      message_ES: 'Error genérico - 1025',
    });
    const refund = jasmine.createSpy().and.resolveTo({ success: false, error });
    Object.assign(TestBed.inject(WalletService), { refund });
    const component = mount().componentInstance;
    component.requestRefund();
    await component.confirmRefund();
    expect(component.refundError()).toBe(error);
    expect(component.paymentUncertain()).toBeTrue();
    component.requestRefund();
    await component.confirmRefund();
    expect(refund).toHaveBeenCalledTimes(1);
  });

  it('requests a refund from the remote balance contract without a fake card selector', async () => {
    const fixture = mount();

    fixture.componentInstance.requestRefund();
    await Promise.resolve();
    expect(fixture.componentInstance.refundQuote()).toBe(2);
  });

  it('shows confirmed success without waiting for history and without reading a stale wallet', async () => {
    const fixture = TestBed.createComponent(AccountRefundComponent);
    const wallet = TestBed.inject(WalletService);
    (TestBed.inject(OperationsService).load as jasmine.Spy).and.returnValue(new Promise<void>(() => undefined));
    const component = fixture.componentInstance;
    component.refundQuote.set(2);
    await component.confirmRefund();
    expect(component.requesting()).toBeFalse();
    expect(component.done()).toBeTrue();
    expect(wallet.load).not.toHaveBeenCalled();
    expect(component.refundedAmount()).toBe(1);
    component.requestRefund();
    await component.confirmRefund();
    expect(wallet.refund).toHaveBeenCalledTimes(1);
  });
});
