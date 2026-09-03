import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ParkingApiService } from '../../../core/services/parking-api.service';
import { WalletService } from '../../../core/services/wallet.service';
import { ParkingFlowStore } from '../parking-flow.store';
import { ParkingConfirmComponent } from './confirm.component';

describe('ParkingConfirmComponent', () => {
  it('loads the wallet on direct access and selects the default card', async () => {
    const defaultCardId = signal('');
    const wallet = {
      balance: signal(0),
      cards: signal([]),
      defaultCardId,
      loading: signal(false),
      load: jasmine.createSpy().and.callFake(async () => defaultCardId.set('7')),
      mainCard: { id: '7', brand: 'VISA', last4: '1234', expiryDate: '12/30', cardholderName: '' },
    };

    TestBed.configureTestingModule({
      imports: [ParkingConfirmComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
        { provide: Router, useValue: { navigate: jasmine.createSpy() } },
        {
          provide: ParkingFlowStore,
          useValue: {
            hasMinimumParkingData: () => true,
            fromStore: () => ({ amount: '1,50 €', plate: '1234567', zone: 'Z2 AZUL', street: 'AITZA KALEA' }),
          },
        },
        { provide: WalletService, useValue: wallet },
        { provide: ParkingApiService, useValue: { confirmParking: jasmine.createSpy(), opsDate: jasmine.createSpy() } },
      ],
    });
    TestBed.overrideComponent(ParkingConfirmComponent, { set: { template: '' } });

    const fixture = TestBed.createComponent(ParkingConfirmComponent);
    await fixture.whenStable();

    expect(wallet.load).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.selectedCardId()).toBe('7');
  });
});
