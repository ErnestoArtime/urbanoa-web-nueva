import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslationService } from '../../../core/services/translation.service';
import { WalletSummaryCardComponent } from './wallet-summary-card.component';

describe('WalletSummaryCardComponent balance availability', () => {
  it('distinguishes unavailable credit from a confirmed zero and offers retry', async () => {
    TestBed.configureTestingModule({ imports: [WalletSummaryCardComponent], providers: [
      provideZonelessChangeDetection(), provideRouter([]),
      { provide: TranslationService, useValue: { translate: (key: string) => key } },
    ] });
    const fixture = TestBed.createComponent(WalletSummaryCardComponent);
    fixture.componentRef.setInput('balance', 0);
    fixture.componentRef.setInput('mainCard', { brand: '', last4: '', cardholderName: '', expiryDate: '' });
    fixture.componentRef.setInput('balanceAvailable', false);
    fixture.componentRef.setInput('balanceError', true);
    const retry = jasmine.createSpy('retry');
    fixture.componentInstance.retry.subscribe(retry);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.wallet-inline-balance')?.textContent?.trim()).toBe('—');
    expect(root.querySelector('[role="alert"]')).not.toBeNull();
    const retryButton = Array.from(root.querySelectorAll('button')).find(button => button.textContent?.trim() === 'common.retry')!;
    retryButton.click();
    expect(retry).toHaveBeenCalledTimes(1);
    fixture.componentRef.setInput('balanceAvailable', true);
    fixture.componentRef.setInput('balanceError', false);
    await fixture.whenStable();
    expect(root.querySelector('.wallet-inline-balance')?.textContent).toContain('0.00 €');
    expect(root.querySelector('[role="alert"]')).toBeNull();
  });
});
