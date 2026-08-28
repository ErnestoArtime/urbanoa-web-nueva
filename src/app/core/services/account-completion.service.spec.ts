import { provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AccountCompletionService } from './account-completion.service';
import { LocationSettingsService } from './location-settings.service';
import { UserService } from './user.service';
import { VehicleService } from './vehicle.service';
import { WalletService } from './wallet.service';

describe('AccountCompletionService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: UserService,
          useValue: { user: signal({ name: 'Ane', surname: 'Lopez', email: 'ane@example.com', nif: '12345678A', phone: '600000000' }) },
        },
        { provide: VehicleService, useValue: { vehicles: signal([{ id: '1', plate: '1234 ABC', isDefault: true }]) } },
        { provide: WalletService, useValue: { cards: signal([{ id: '7' }]) } },
      ],
    });
  });

  it('moves from 75 to 100 percent when location is configured', () => {
    const completion = TestBed.inject(AccountCompletionService);
    const location = TestBed.inject(LocationSettingsService);

    expect(completion.percent()).toBe(75);

    location.setPreferredCity('donostia', 'Donostia');

    expect(completion.percent()).toBe(100);
  });
});
