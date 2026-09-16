import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { PaymentSummaryComponent } from './payment-summary.component';

describe('PaymentSummaryComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [PaymentSummaryComponent],
      providers: [provideZonelessChangeDetection()],
    }),
  );

  for (const balance of [0, 0.5]) {
    it(`shows missing payment method with ${balance} balance and no card`, async () => {
      const fixture = TestBed.createComponent(PaymentSummaryComponent);
      fixture.componentRef.setInput('wallet', { balance, mainCard: { id: '', brand: '', last4: '', expiryDate: '' } });
      fixture.componentRef.setInput('totalAmount', 1.5);
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('.missing-payment')).not.toBeNull();
      expect(fixture.nativeElement.textContent).not.toContain('••••');
      expect(fixture.nativeElement.querySelector('.card-brand')).toBeNull();
    });
  }
});
