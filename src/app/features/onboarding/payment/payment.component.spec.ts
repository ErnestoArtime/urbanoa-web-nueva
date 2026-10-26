import { Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MainCard, WalletService } from '../../../core/services/wallet.service';
import { TranslationService } from '../../../core/services/translation.service';
import { OnboardingPaymentComponent } from './payment.component';

@Component({ template: '' })
class LocationDestination {}

describe('onboarding card setup', () => {
  it('opens the card form and continues only when the backend confirms a new card', async () => {
    const wallet = {
      source: signal('remote'),
      cards: signal<MainCard[]>([]),
      load: jasmine.createSpy('load').and.resolveTo(),
      responseError: () => null,
      loadPaymentMethodForm: jasmine.createSpy('form').and.resolveTo('<html></html>'),
    };
    TestBed.configureTestingModule({
      imports: [OnboardingPaymentComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: 'onboarding/location', component: LocationDestination }]),
        { provide: WalletService, useValue: wallet },
        { provide: TranslationService, useValue: { translate: (key: string) => key } },
      ],
    });
    const fixture = TestBed.createComponent(OnboardingPaymentComponent);
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('button.btn-primary') as HTMLButtonElement).click();
    await fixture.whenStable();
    await wallet.load.calls.mostRecent().returnValue;
    await wallet.loadPaymentMethodForm.calls.mostRecent().returnValue;
    await fixture.whenStable();
    const frame = fixture.nativeElement.querySelector('iframe') as HTMLIFrameElement;
    expect(frame).withContext(fixture.nativeElement.innerHTML).not.toBeNull();
    expect(TestBed.inject(Router).url).not.toBe('/onboarding/location');
    wallet.load.and.callFake(async () => {
      wallet.cards.set([{ id: 'new', brand: 'Visa', last4: '1234', expiryDate: '12/30', cardholderName: '' }]);
    });
    window.dispatchEvent(
      new MessageEvent('message', { data: 'urbanoa-card-added', origin: window.location.origin, source: frame.contentWindow }),
    );
    await wallet.load.calls.mostRecent().returnValue;
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/onboarding/location');
  });
});
