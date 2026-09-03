import { NO_ERRORS_SCHEMA, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, RouterLink } from '@angular/router';
import { DashboardApiService } from '../../core/services/dashboard-api.service';
import { NavigationToCarService } from '../../core/services/navigation-to-car.service';
import { OperationsService, type ActiveParking } from '../../core/services/operations.service';
import { ParkingSessionService } from '../../core/services/parking-session.service';
import { TranslationService } from '../../core/services/translation.service';
import { UserService } from '../../core/services/user.service';
import { VehicleService } from '../../core/services/vehicle.service';
import { WalletService } from '../../core/services/wallet.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { HomeComponent } from './home.component';

describe('HomeComponent parking status progress', () => {
  it('keeps loaded parking cards visible while reporting pending status requests', async () => {
    const activeLoading = signal(true);
    const parking: ActiveParking = {
      id: 'remote-AAA111',
      plate: 'AAA111',
      vehicleId: 'vehicle-1',
      zone: 'Z2 AZUL',
      startTime: '15:19',
      durationLabel: '60 min',
      timeRemaining: '00:30:00',
      endTime: '16:19',
    };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TranslationService, useValue: { translate: (key: string) => key } },
        {
          provide: OperationsService,
          useValue: { activeLoading: activeLoading.asReadonly(), operations: signal([]) },
        },
        {
          provide: ParkingSessionService,
          useValue: { activeParkings: signal([parking]), unparkError: signal(null) },
        },
        {
          provide: UserService,
          useValue: { user: signal({ name: 'Test', surname: 'User', email: 'test@example.com' }) },
        },
        {
          provide: VehicleService,
          useValue: { mainVehicle: signal(undefined) },
        },
        {
          provide: WalletService,
          useValue: { balance: signal(0), cards: signal([]), mainCard: undefined },
        },
        {
          provide: DashboardApiService,
          useValue: { source: signal<'remote'>('remote'), load: jasmine.createSpy('load').and.resolveTo() },
        },
        { provide: NavigationToCarService, useValue: jasmine.createSpyObj('NavigationToCarService', ['open']) },
      ],
    })
      .overrideComponent(HomeComponent, { set: { imports: [TranslatePipe, RouterLink], schemas: [NO_ERRORS_SCHEMA] } })
      .compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
    await fixture.whenStable();

    const progress = fixture.nativeElement.querySelector('.parking-status-progress');
    expect(progress?.querySelector('.sr-only')?.textContent).toContain('dashboard.loadingActiveParkings');
    expect(progress?.querySelector('.parking-status-spinner')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-parking-ticket-card')).not.toBeNull();

    activeLoading.set(false);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('.parking-status-progress')).toBeNull();
  });
});
